import express from 'express';
import BillingGroup from '../models/BillingGroup.js';
import Order from '../models/Order.js';
import { protect, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// All routes require admin access
router.use(protect, requireAdmin);

// @route   GET /api/bills/summary/:billingGroupId
// @desc    Get bill summary (total amount)
// @access  Private/Admin
router.get('/summary/:billingGroupId', async (req, res) => {
  try {
    const billingGroup = await BillingGroup.findById(req.params.billingGroupId);
    
    if (!billingGroup) {
      return res.status(404).json({
        success: false,
        message: 'Billing group not found',
      });
    }

    // Recalculate totals
    await billingGroup.calculateTotal();

    res.json({
      success: true,
      bill: {
        billingGroupId: billingGroup._id,
        billingName: billingGroup.name,
        totalAmount: billingGroup.totalAmount,
        orderCount: billingGroup.orderCount,
        startDate: billingGroup.startDate,
        endDate: billingGroup.endDate,
        status: billingGroup.isActive ? 'active' : 'completed',
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   GET /api/bills/detailed/:billingGroupId
// @desc    Get detailed bill with all orders and customer names
// @access  Private/Admin
router.get('/detailed/:billingGroupId', async (req, res) => {
  try {
    const billingGroup = await BillingGroup.findById(req.params.billingGroupId);
    
    if (!billingGroup) {
      return res.status(404).json({
        success: false,
        message: 'Billing group not found',
      });
    }

    const orders = await Order.find({ billingGroupId: billingGroup._id })
      .populate('tableId', 'tableNumber location')
      .sort({ createdAt: 1 });

    // Recalculate totals
    await billingGroup.calculateTotal();

    res.json({
      success: true,
      bill: {
        billingGroupId: billingGroup._id,
        billingName: billingGroup.name,
        totalAmount: billingGroup.totalAmount,
        orderCount: billingGroup.orderCount,
        startDate: billingGroup.startDate,
        endDate: billingGroup.endDate,
        status: billingGroup.isActive ? 'active' : 'completed',
        orders: orders.map(order => ({
          _id: order._id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          tableNumber: order.tableNumber,
          items: order.items.map(item => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            subtotal: item.price * item.quantity,
          })),
          totalAmount: order.totalAmount,
          createdAt: order.createdAt,
          status: order.status,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
