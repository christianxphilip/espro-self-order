import express from 'express';
import Order from '../models/Order.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// @route   GET /api/barista/orders/pending
// @desc    Get pending orders
// @access  Private
router.get('/orders/pending', async (req, res) => {
  try {
    const orders = await Order.find({
      status: { $in: ['pending', 'confirmed'] }
    })
      .populate('tableId', 'tableNumber location')
      .sort({ createdAt: 1 });
    
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

// @route   GET /api/barista/orders/active
// @desc    Get active orders (pending, confirmed, preparing, ready)
// @access  Private
router.get('/orders/active', async (req, res) => {
  try {
    const orders = await Order.find({
      status: { $in: ['pending', 'confirmed', 'preparing', 'ready'] }
    })
      .populate('tableId', 'tableNumber location')
      .sort({ createdAt: 1 });
    
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

// @route   GET /api/barista/dashboard
// @desc    Get barista dashboard stats
// @access  Private
router.get('/dashboard', async (req, res) => {
  try {
    const [pendingCount, preparingCount, readyCount, totalToday] = await Promise.all([
      Order.countDocuments({ status: { $in: ['pending', 'confirmed'] } }),
      Order.countDocuments({ status: 'preparing' }),
      Order.countDocuments({ status: 'ready' }),
      Order.countDocuments({
        createdAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }),
    ]);

    res.json({
      success: true,
      stats: {
        pending: pendingCount,
        preparing: preparingCount,
        ready: readyCount,
        totalToday,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   PUT /api/barista/orders/:id/start
// @desc    Mark order as preparing
// @access  Private
router.put('/orders/:id/start', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    order.status = 'preparing';
    order.preparedBy = req.user._id;
    await order.save();

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

// @route   PUT /api/barista/orders/:id/complete
// @desc    Mark order as ready
// @access  Private
router.put('/orders/:id/complete', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    order.status = 'ready';
    await order.save();

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

// @route   PUT /api/barista/orders/:id/dispatch
// @desc    Mark order as dispatched/delivered
// @access  Private
router.put('/orders/:id/dispatch', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    order.status = 'completed';
    order.completedAt = new Date();
    await order.save();

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

// @route   PUT /api/barista/orders/:id/cancel
// @desc    Cancel order
// @access  Private
router.put('/orders/:id/cancel', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    order.status = 'cancelled';
    await order.save();

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
