import express from 'express';
import BillingGroup from '../models/BillingGroup.js';
import { protect, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/billing-groups/active/current
// @desc    Get currently active billing group
// @access  Public (for order validation)
// NOTE: This must be defined BEFORE the protect middleware
router.get('/active/current', async (req, res) => {
  try {
    console.log('[BillingGroups] Public route: /active/current');
    const billingGroup = await BillingGroup.findOne({ isActive: true });
    
    if (!billingGroup) {
      console.log('[BillingGroups] No active billing group found');
      return res.status(404).json({
        success: false,
        message: 'No active billing group',
      });
    }

    console.log(`[BillingGroups] Active billing group found: ${billingGroup.name}`);
    res.json({
      success: true,
      billingGroup,
    });
  } catch (error) {
    console.error('[BillingGroups] Error in /active/current:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// All other routes require admin access
router.use(protect, requireAdmin);

// @route   GET /api/billing-groups
// @desc    Get all billing groups
// @access  Private/Admin
router.get('/', async (req, res) => {
  try {
    const billingGroups = await BillingGroup.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      billingGroups,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   GET /api/billing-groups/:id
// @desc    Get billing group by ID
// @access  Private/Admin
router.get('/:id', async (req, res) => {
  try {
    const billingGroup = await BillingGroup.findById(req.params.id)
      .populate('createdBy', 'name email');
    
    if (!billingGroup) {
      return res.status(404).json({
        success: false,
        message: 'Billing group not found',
      });
    }

    res.json({
      success: true,
      billingGroup,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   POST /api/billing-groups
// @desc    Create billing group
// @access  Private/Admin
router.post('/', async (req, res) => {
  try {
    const { name, startDate, endDate } = req.body;

    const billingGroup = await BillingGroup.create({
      name,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : null,
      createdBy: req.user._id,
      isActive: false, // Default to inactive
    });

    res.status(201).json({
      success: true,
      billingGroup,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   PUT /api/billing-groups/:id
// @desc    Update billing group
// @access  Private/Admin
router.put('/:id', async (req, res) => {
  try {
    const billingGroup = await BillingGroup.findById(req.params.id);
    
    if (!billingGroup) {
      return res.status(404).json({
        success: false,
        message: 'Billing group not found',
      });
    }

    const { name, startDate, endDate } = req.body;

    if (name) billingGroup.name = name;
    if (startDate) billingGroup.startDate = new Date(startDate);
    if (endDate !== undefined) billingGroup.endDate = endDate ? new Date(endDate) : null;

    await billingGroup.save();

    res.json({
      success: true,
      billingGroup,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   PUT /api/billing-groups/:id/activate
// @desc    Activate billing group (enable self-service ordering)
// @access  Private/Admin
router.put('/:id/activate', async (req, res) => {
  try {
    const billingGroup = await BillingGroup.findById(req.params.id);
    
    if (!billingGroup) {
      return res.status(404).json({
        success: false,
        message: 'Billing group not found',
      });
    }

    // Deactivate all other billing groups
    await BillingGroup.updateMany(
      { _id: { $ne: billingGroup._id } },
      { isActive: false }
    );

    billingGroup.isActive = true;
    await billingGroup.save();

    res.json({
      success: true,
      billingGroup,
      message: 'Self-service ordering enabled',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   PUT /api/billing-groups/:id/deactivate
// @desc    Deactivate billing group (disable self-service ordering)
// @access  Private/Admin
router.put('/:id/deactivate', async (req, res) => {
  try {
    const billingGroup = await BillingGroup.findById(req.params.id);
    
    if (!billingGroup) {
      return res.status(404).json({
        success: false,
        message: 'Billing group not found',
      });
    }

    billingGroup.isActive = false;
    await billingGroup.save();

    res.json({
      success: true,
      billingGroup,
      message: 'Self-service ordering disabled',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   PUT /api/billing-groups/:id/close
// @desc    Close billing group (mark as paid/completed)
// @access  Private/Admin
router.put('/:id/close', async (req, res) => {
  try {
    const billingGroup = await BillingGroup.findById(req.params.id);
    
    if (!billingGroup) {
      return res.status(404).json({
        success: false,
        message: 'Billing group not found',
      });
    }

    // Deactivate and set end date
    billingGroup.isActive = false;
    if (!billingGroup.endDate) {
      billingGroup.endDate = new Date();
    }
    await billingGroup.save();

    res.json({
      success: true,
      billingGroup,
      message: 'Billing group closed successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
