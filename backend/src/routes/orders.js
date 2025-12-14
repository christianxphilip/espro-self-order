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
      const itemTotal = menuItem.price * quantity;
      totalAmount += itemTotal;

      orderItems.push({
        menuItemId: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        quantity,
        status: 'pending',
        notes: item.notes || '',
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
// @desc    Get orders for a table
// @access  Public (for polling)
// NOTE: This route must come before /:id to avoid route conflicts
router.get('/table/:tableId', async (req, res) => {
  try {
    const orders = await Order.find({ tableId: req.params.tableId })
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
    
    // If order has only one item, update order status to match item status
    if (order.items.length === 1) {
      // Map item status to order status
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
