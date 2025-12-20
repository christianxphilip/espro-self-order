import express from 'express';
import Order from '../models/Order.js';
import Table from '../models/Table.js';
import BillingGroup from '../models/BillingGroup.js';
import MenuItem from '../models/MenuItem.js';
import { protect } from '../middleware/auth.js';
import { emitToBaristas, emitToTable } from '../services/socketService.js';

const router = express.Router();

// @route   POST /api/orders
// @desc    Create new order (public, but requires active billing group)
// @access  Public
router.post('/', async (req, res) => {
  try {
    console.log('[Orders] Public route: POST /');
    const { tableId, customerName, items, orderType, requestId } = req.body;
    console.log('[Orders] Request body:', { tableId, customerName, itemsCount: items?.length, orderType, requestId });

    // Check for duplicate request (idempotency)
    if (requestId) {
      const existingOrder = await Order.findOne({ requestId });
      if (existingOrder) {
        console.log('[Orders] Duplicate request detected, returning existing order:', existingOrder._id);
        return res.status(200).json({
          success: true,
          order: existingOrder,
          message: 'Order already processed',
        });
      }
    }

    // Validate table
    if (!tableId) {
      return res.status(400).json({
        success: false,
        message: 'Table ID is required',
      });
    }

    const table = await Table.findById(tableId);
    console.log('[Orders] Table lookup result:', table ? { id: table._id, number: table.tableNumber, isActive: table.isActive } : 'Not found');

    if (!table) {
      return res.status(400).json({
        success: false,
        message: 'Table not found',
      });
    }

    if (!table.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Table is inactive',
      });
    }

    // Validate billing group
    let billingGroup;
    if (table.billingGroupId) {
      billingGroup = await BillingGroup.findById(table.billingGroupId);
    } else {
      billingGroup = await BillingGroup.findOne({ isActive: true });
    }

    if (!billingGroup || !billingGroup.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Self-service ordering is not currently active',
      });
    }

    // Validate items
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one item',
      });
    }

    // Validate customer name
    if (!customerName || customerName.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Customer name is required (minimum 2 characters)',
      });
    }

    // Validate and calculate order items
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItemId);

      if (!menuItem) {
        return res.status(400).json({
          success: false,
          message: `Menu item not found: ${item.menuItemId}`,
        });
      }

      if (!menuItem.isAvailable) {
        return res.status(400).json({
          success: false,
          message: `Menu item is not available: ${menuItem.name}`,
        });
      }

      const quantity = item.quantity || 1;

      // Calculate base price
      let itemPrice = menuItem.price;

      // Determine temperature - default based on menu item option
      let temperature = item.temperature;
      if (!temperature) {
        // Default based on menu item temperature option
        if (menuItem.temperatureOption === 'iced-only' || menuItem.temperatureOption === 'iced') {
          temperature = 'iced';
        } else if (menuItem.temperatureOption === 'hot') {
          temperature = 'hot';
        } else {
          temperature = 'hot'; // Default fallback
        }
      }

      // Add temperature surcharge for iced (+20 pesos) - but NOT for iced-only or iced items
      // The surcharge only applies when user selects iced from a 'both' option
      if (temperature === 'iced' && menuItem.temperatureOption !== 'iced-only' && menuItem.temperatureOption !== 'iced') {
        itemPrice += 20;
      }

      // Add extra espresso shot (+30 pesos) if allowed and selected
      if (item.extraEspresso && menuItem.allowExtraEspresso) {
        itemPrice += 30;
      }

      // Add oat milk substitute (+40 pesos) if allowed and selected
      if (item.oatMilk && menuItem.allowOatMilk) {
        itemPrice += 40;
      }

      // Validate temperature option
      if ((menuItem.temperatureOption === 'iced-only' || menuItem.temperatureOption === 'iced') && temperature !== 'iced') {
        return res.status(400).json({
          success: false,
          message: `${menuItem.name} is only available in iced`,
        });
      }

      if (menuItem.temperatureOption === 'hot' && temperature !== 'hot') {
        return res.status(400).json({
          success: false,
          message: `${menuItem.name} is only available in hot`,
        });
      }

      // Validate add-ons
      if (item.extraEspresso && !menuItem.allowExtraEspresso) {
        return res.status(400).json({
          success: false,
          message: `${menuItem.name} does not support extra espresso shot`,
        });
      }

      if (item.oatMilk && !menuItem.allowOatMilk) {
        return res.status(400).json({
          success: false,
          message: `${menuItem.name} does not support oat milk substitute`,
        });
      }

      const itemTotal = itemPrice * quantity;
      totalAmount += itemTotal;

      orderItems.push({
        menuItemId: menuItem._id,
        name: menuItem.name,
        price: itemPrice, // Store the calculated price with add-ons
        quantity,
        status: 'pending',
        notes: item.notes || '',
        temperature: temperature,
        extraEspresso: item.extraEspresso || false,
        oatMilk: item.oatMilk || false,
      });
    }

    // Create order
    const order = await Order.create({
      tableId: table._id,
      tableNumber: table.tableNumber,
      billingGroupId: billingGroup._id,
      customerName: customerName.trim(),
      items: orderItems,
      totalAmount,
      orderType: orderType || 'dine-in',
      status: 'pending',
      requestId: requestId || undefined, // Only set if provided
    });

    // Emit socket event if WebSocket is enabled
    emitToBaristas('new-order', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      tableNumber: order.tableNumber,
      customerName: order.customerName,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
    });

    res.status(201).json({
      success: true,
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   GET /api/orders/table/:tableId
// @desc    Get orders for a table (only from active billing group)
// @access  Public (for polling)
// NOTE: This route must come before /:id to avoid route conflicts
router.get('/table/:tableId', async (req, res) => {
  try {
    // Get the active billing group
    const activeBillingGroup = await BillingGroup.findOne({ isActive: true });

    if (!activeBillingGroup) {
      // If no active billing group, return empty array
      return res.json({
        success: true,
        orders: [],
      });
    }

    // Get orders for the table that belong to the active billing group
    const orders = await Order.find({
      tableId: req.params.tableId,
      billingGroupId: activeBillingGroup._id
    })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   GET /api/orders/:id
// @desc    Get order by ID (public for customers to check order status)
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    console.log('[Orders] Public route: GET /:id', req.params.id);
    const order = await Order.findById(req.params.id)
      .populate('tableId', 'tableNumber location')
      .populate('billingGroupId', 'name');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    res.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error('[Orders] Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order status
// @access  Private (barista)
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    const previousOrderStatus = order.status;
    const previousItemStatus = order.items.length === 1 ? order.items[0].status : null;

    order.status = status;

    // If order has only one item, update item status to match order status
    if (order.items.length === 1) {
      // Map order status to item status
      const statusMap = {
        'pending': 'pending',
        'confirmed': 'pending',
        'preparing': 'preparing',
        'ready': 'ready',
        'completed': 'delivered',
        'cancelled': 'pending', // Keep item as pending if order is cancelled
      };

      const newItemStatus = statusMap[status] || order.items[0].status;
      if (newItemStatus !== order.items[0].status) {
        order.items[0].status = newItemStatus;
        console.log(`[Orders] Auto-updating item status to ${newItemStatus} (single item order)`);
      }
    }

    if (status === 'completed') {
      order.completedAt = new Date();
      order.preparedBy = req.user._id;
    }

    await order.save();

    // Emit socket event
    emitToBaristas('order-updated', {
      orderId: order._id,
      status: order.status,
    });

    emitToTable(order.tableId.toString(), 'order-updated', {
      orderId: order._id,
      status: order.status,
    });

    // If item status was updated, emit item-status-updated event
    if (order.items.length === 1 && previousItemStatus && order.items[0].status !== previousItemStatus) {
      emitToBaristas('item-status-updated', {
        orderId: order._id,
        itemId: order.items[0]._id,
        status: order.items[0].status,
      });

      emitToTable(order.tableId.toString(), 'item-status-updated', {
        orderId: order._id,
        itemId: order.items[0]._id,
        status: order.items[0].status,
      });
    }

    res.json({
      success: true,
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Helper function to calculate order status from item statuses
const calculateOrderStatusFromItems = (items) => {
  if (items.length === 0) return 'pending';

  const statuses = items.map(item => item.status);

  // All delivered
  if (statuses.every(s => s === 'delivered')) {
    return 'ready'; // Manager will mark as completed
  }

  // All ready
  if (statuses.every(s => s === 'ready')) {
    return 'ready';
  }

  // Any preparing
  if (statuses.some(s => s === 'preparing')) {
    return 'preparing';
  }

  // Default: pending/confirmed
  return 'confirmed';
};

// @route   PUT /api/orders/:id/items/:itemId/status
// @desc    Update item status within an order
// @access  Private (barista)
router.put('/:id/items/:itemId/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    const item = order.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Order item not found',
      });
    }

    const previousOrderStatus = order.status;
    item.status = status;

    // Auto-update order status based on all item statuses
    if (order.items.length === 1) {
      // Single item: map directly
      const statusMap = {
        'pending': 'pending',
        'preparing': 'preparing',
        'ready': 'ready',
        'delivered': 'completed',
      };

      const newOrderStatus = statusMap[status] || order.status;
      if (newOrderStatus !== order.status) {
        order.status = newOrderStatus;
        console.log(`[Orders] Auto-updating order status to ${newOrderStatus} (single item order)`);
      }
    } else {
      // Multi-item: calculate based on all items
      const calculatedStatus = calculateOrderStatusFromItems(order.items);
      if (calculatedStatus !== order.status && order.status !== 'completed') {
        // Don't auto-change completed status (manager control)
        order.status = calculatedStatus;
        console.log(`[Orders] Auto-updating order status to ${calculatedStatus} based on item statuses`);
      }
    }

    await order.save();

    // Emit socket event
    emitToBaristas('item-status-updated', {
      orderId: order._id,
      itemId: item._id,
      status: item.status,
    });

    emitToTable(order.tableId.toString(), 'item-status-updated', {
      orderId: order._id,
      itemId: item._id,
      status: item.status,
    });

    // If order status was updated, emit order-updated event
    if (order.items.length === 1 && order.status !== previousOrderStatus) {
      emitToBaristas('order-updated', {
        orderId: order._id,
        status: order.status,
      });

      emitToTable(order.tableId.toString(), 'order-updated', {
        orderId: order._id,
        status: order.status,
      });
    }

    res.json({
      success: true,
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
