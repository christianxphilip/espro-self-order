import express from 'express';
import Order from '../models/Order.js';
import BillingGroup from '../models/BillingGroup.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Helper function to get active billing group
const getActiveBillingGroup = async () => {
  const billingGroup = await BillingGroup.findOne({ isActive: true });
  return billingGroup;
};

// @route   GET /api/barista/orders/pending
// @desc    Get pending orders
// @access  Private
router.get('/orders/pending', async (req, res) => {
  try {
    const billingGroup = await getActiveBillingGroup();

    if (!billingGroup) {
      return res.json({
        success: true,
        orders: [],
      });
    }

    const orders = await Order.find({
      status: { $in: ['pending', 'confirmed'] },
      billingGroupId: billingGroup._id
    })
      .populate('tableId', 'tableNumber location')
      .populate('items.menuItemId', 'category')
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
// @desc    Optional query param: status (pending, preparing, ready) to filter by specific status
// @access  Private
router.get('/orders/active', async (req, res) => {
  try {
    const billingGroup = await getActiveBillingGroup();

    if (!billingGroup) {
      return res.json({
        success: true,
        orders: [],
      });
    }

    const { status } = req.query;

    let query = {
      status: { $in: ['pending', 'confirmed', 'preparing', 'ready'] },
      billingGroupId: billingGroup._id
    };

    // Filter by specific status if provided
    if (status === 'pending') {
      query.status = { $in: ['pending', 'confirmed'] };
    } else if (status === 'preparing') {
      query.status = 'preparing';
    } else if (status === 'ready') {
      query.status = 'ready';
    }

    const orders = await Order.find(query)
      .populate('tableId', 'tableNumber location')
      .populate('items.menuItemId', 'category')
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

// @route   GET /api/barista/orders/today
// @desc    Get all orders from today (including completed/dispatched)
// @access  Private
router.get('/orders/today', async (req, res) => {
  try {
    const billingGroup = await getActiveBillingGroup();

    if (!billingGroup) {
      return res.json({
        success: true,
        orders: [],
      });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const orders = await Order.find({
      createdAt: {
        $gte: startOfDay
      },
      billingGroupId: billingGroup._id
    })
      .populate('tableId', 'tableNumber location')
      .populate('items.menuItemId', 'category')
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

// @route   GET /api/barista/orders/all
// @desc    Get all orders (all statuses)
// @access  Private
router.get('/orders/all', async (req, res) => {
  try {
    const billingGroup = await getActiveBillingGroup();

    if (!billingGroup) {
      return res.json({
        success: true,
        orders: [],
      });
    }

    const orders = await Order.find({
      billingGroupId: billingGroup._id
    })
      .populate('tableId', 'tableNumber location')
      .populate('items.menuItemId', 'category')
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

// @route   GET /api/barista/orders/completed
// @desc    Get completed orders
// @access  Private
router.get('/orders/completed', async (req, res) => {
  try {
    const billingGroup = await getActiveBillingGroup();

    if (!billingGroup) {
      return res.json({
        success: true,
        orders: [],
      });
    }

    const orders = await Order.find({
      status: 'completed',
      billingGroupId: billingGroup._id
    })
      .populate('tableId', 'tableNumber location')
      .populate('items.menuItemId', 'category')
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

// @route   GET /api/barista/dashboard
// @desc    Get barista dashboard stats
// @access  Private
router.get('/dashboard', async (req, res) => {
  try {
    const billingGroup = await getActiveBillingGroup();

    if (!billingGroup) {
      return res.json({
        success: true,
        stats: {
          pending: 0,
          preparing: 0,
          ready: 0,
          totalToday: 0,
          all: 0,
          completed: 0,
        },
      });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [pendingCount, preparingCount, readyCount, totalToday, allCount, completedCount] = await Promise.all([
      Order.countDocuments({
        status: { $in: ['pending', 'confirmed'] },
        billingGroupId: billingGroup._id
      }),
      Order.countDocuments({
        status: 'preparing',
        billingGroupId: billingGroup._id
      }),
      Order.countDocuments({
        status: 'ready',
        billingGroupId: billingGroup._id
      }),
      Order.countDocuments({
        createdAt: {
          $gte: startOfDay
        },
        billingGroupId: billingGroup._id
      }),
      Order.countDocuments({
        billingGroupId: billingGroup._id
      }),
      Order.countDocuments({
        status: 'completed',
        billingGroupId: billingGroup._id
      }),
    ]);

    res.json({
      success: true,
      stats: {
        pending: pendingCount,
        preparing: preparingCount,
        ready: readyCount,
        totalToday,
        all: allCount,
        completed: completedCount,
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

    // Update order status
    order.status = 'ready';

    // Update all items to ready status
    order.items.forEach(item => {
      item.status = 'ready';
    });

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

    // Update order status
    order.status = 'completed';
    order.completedAt = new Date();

    // Update all items to delivered status (items use 'delivered', order uses 'completed')
    order.items.forEach(item => {
      item.status = 'delivered';
    });

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
