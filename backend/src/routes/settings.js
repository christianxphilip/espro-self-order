import express from 'express';
import Settings from '../models/Settings.js';
import { protect, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/settings/public
// @desc    Get current settings (public - for frontend apps)
// @access  Public
router.get('/public', async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    res.json({
      success: true,
      settings: {
        websocketEnabled: settings.websocketEnabled,
        pollingEnabled: settings.pollingEnabled,
        pollingInterval: settings.pollingInterval,
        customRedirectEnabled: settings.customRedirectEnabled,
        customRedirectUrl: settings.customRedirectUrl,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// All other routes require admin access
router.use(protect, requireAdmin);

// @route   GET /api/settings
// @desc    Get current settings
// @access  Private/Admin
router.get('/', async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    res.json({
      success: true,
      settings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   PUT /api/settings
// @desc    Update settings
// @access  Private/Admin
router.put('/', async (req, res) => {
  try {
    const { websocketEnabled, pollingEnabled, pollingInterval, customRedirectEnabled, customRedirectUrl } = req.body;

    let settings = await Settings.findOne();
    
    if (!settings) {
      // Create new settings if none exist
      settings = await Settings.create({
        websocketEnabled: websocketEnabled ?? false,
        pollingEnabled: pollingEnabled ?? true,
        pollingInterval: pollingInterval ?? 3000,
        customRedirectEnabled: customRedirectEnabled ?? false,
        customRedirectUrl: customRedirectUrl || null,
        updatedBy: req.user._id,
      });
    } else {
      // Update existing settings
      if (websocketEnabled !== undefined) {
        settings.websocketEnabled = websocketEnabled;
      }
      if (pollingEnabled !== undefined) {
        settings.pollingEnabled = pollingEnabled;
      }
      if (pollingInterval !== undefined) {
        if (pollingInterval < 1000 || pollingInterval > 60000) {
          return res.status(400).json({
            success: false,
            message: 'Polling interval must be between 1000 and 60000 milliseconds',
          });
        }
        settings.pollingInterval = pollingInterval;
      }
      if (customRedirectEnabled !== undefined) {
        settings.customRedirectEnabled = customRedirectEnabled;
      }
      if (customRedirectUrl !== undefined) {
        settings.customRedirectUrl = customRedirectUrl || null;
      }
      settings.updatedBy = req.user._id;
      await settings.save();
    }

    res.json({
      success: true,
      settings,
      message: 'Settings updated successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;

