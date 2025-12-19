import express from 'express';
import Table from '../models/Table.js';
import BillingGroup from '../models/BillingGroup.js';
import Settings from '../models/Settings.js';
import { protect, requireAdmin } from '../middleware/auth.js';
import { generateQRCode, generateQRCodeString } from '../services/qrCodeService.js';
import { deleteQRCodeFromS3 } from '../services/s3Service.js';

const router = express.Router();

// @route   GET /api/tables/redirect
// @desc    Redirect endpoint for Bitly links - redirects to self-order portal
// @access  Public
router.get('/redirect', async (req, res) => {
  try {
    const { table } = req.query;
    
    if (!table) {
      return res.status(400).json({
        success: false,
        message: 'Table parameter is required',
      });
    }

    console.log(`[Tables] Redirect request for table: ${table}`);
    
    // Try to find table by table number first, then by QR code
    let tableDoc = await Table.findOne({ 
      tableNumber: table, 
      isActive: true 
    });
    
    if (!tableDoc) {
      // Try finding by QR code
      tableDoc = await Table.findOne({ 
        qrCode: table, 
        isActive: true 
      });
    }
    
    if (!tableDoc) {
      console.log(`[Tables] Table not found for: ${table}`);
      const selfOrderUrl = process.env.SELF_ORDER_URL || process.env.FRONTEND_URL || 'http://localhost:8084';
      // Redirect to self-order portal with error message or just to home
      return res.redirect(`${selfOrderUrl}/?error=table_not_found`);
    }

    // Check global custom redirect setting first
    const globalSettings = await Settings.getSettings();
    if (globalSettings.customRedirectEnabled && globalSettings.customRedirectUrl) {
      console.log(`[Tables] Global custom redirect enabled`);
      console.log(`[Tables] Redirecting to global custom URL: ${globalSettings.customRedirectUrl}`);
      return res.redirect(globalSettings.customRedirectUrl);
    }

    // Check if table-specific custom redirect is enabled
    if (tableDoc.customRedirectEnabled && tableDoc.customRedirectUrl) {
      console.log(`[Tables] Table-specific custom redirect enabled for table: ${tableDoc.tableNumber}`);
      console.log(`[Tables] Redirecting to custom URL: ${tableDoc.customRedirectUrl}`);
      return res.redirect(tableDoc.customRedirectUrl);
    }

    // Default behavior: Check for active billing group and redirect to self-order portal
    let billingGroup;
    if (tableDoc.billingGroupId) {
      billingGroup = await BillingGroup.findById(tableDoc.billingGroupId);
    } else {
      billingGroup = await BillingGroup.findOne({ isActive: true });
    }

    if (!billingGroup || !billingGroup.isActive) {
      console.log(`[Tables] No active billing group for table: ${tableDoc.tableNumber}`);
      const selfOrderUrl = process.env.SELF_ORDER_URL || process.env.FRONTEND_URL || 'http://localhost:8084';
      return res.redirect(`${selfOrderUrl}/?error=ordering_inactive`);
    }

    // Redirect to self-order portal with the QR code
    const selfOrderUrl = process.env.SELF_ORDER_URL || process.env.FRONTEND_URL || 'http://localhost:8084';
    const redirectUrl = `${selfOrderUrl}/scan/${tableDoc.qrCode}`;
    
    console.log(`[Tables] Redirecting to: ${redirectUrl}`);
    res.redirect(redirectUrl);
  } catch (error) {
    console.error(`[Tables] Error in redirect:`, error);
    const selfOrderUrl = process.env.SELF_ORDER_URL || process.env.FRONTEND_URL || 'http://localhost:8084';
    res.redirect(`${selfOrderUrl}/?error=server_error`);
  }
});

// @route   GET /api/tables/qr/:qrCode
// @desc    Get table by QR code (public)
// @access  Public
router.get('/qr/:qrCode', async (req, res) => {
  try {
    console.log(`[Tables] Public QR lookup: ${req.params.qrCode}`);
    const table = await Table.findOne({ qrCode: req.params.qrCode, isActive: true });
    
    if (!table) {
      console.log(`[Tables] Table not found or inactive for QR: ${req.params.qrCode}`);
      return res.status(404).json({
        success: false,
        message: 'Table not found or inactive',
      });
    }

    // Check for active billing group (required for self-service ordering)
    let billingGroup;
    if (table.billingGroupId) {
      billingGroup = await BillingGroup.findById(table.billingGroupId);
    } else {
      // If table doesn't have a billing group, check for any active billing group
      billingGroup = await BillingGroup.findOne({ isActive: true });
    }

    if (!billingGroup || !billingGroup.isActive) {
      console.log(`[Tables] No active billing group found for table: ${table.tableNumber}`);
      return res.status(400).json({
        success: false,
        message: 'Self-service ordering is not currently active. Please contact staff.',
      });
    }

    console.log(`[Tables] Table found: ${table.tableNumber} (${table._id}), Billing Group: ${billingGroup.billingName}`);
    res.json({
      success: true,
      table,
    });
  } catch (error) {
    console.error(`[Tables] Error in QR lookup:`, error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   GET /api/tables
// @desc    Get all tables
// @access  Private/Admin
router.get('/', protect, requireAdmin, async (req, res) => {
  try {
    const tables = await Table.find().sort({ tableNumber: 1 });
    res.json({
      success: true,
      tables,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   GET /api/tables/:id
// @desc    Get table by ID
// @access  Private/Admin
router.get('/:id', protect, requireAdmin, async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);
    
    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found',
      });
    }

    res.json({
      success: true,
      table,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   POST /api/tables
// @desc    Create new table
// @access  Private/Admin
router.post('/', protect, requireAdmin, async (req, res) => {
  try {
    const { tableNumber, location, billingGroupId, customRedirectEnabled, customRedirectUrl } = req.body;

    // Check if table number already exists
    const existingTable = await Table.findOne({ tableNumber });
    if (existingTable) {
      return res.status(400).json({
        success: false,
        message: 'Table number already exists',
      });
    }

    const qrCode = generateQRCodeString();

    const table = await Table.create({
      tableNumber,
      qrCode,
      location,
      billingGroupId: billingGroupId || null,
      customRedirectEnabled: customRedirectEnabled || false,
      customRedirectUrl: customRedirectUrl || null,
    });

    // Generate QR code with actual table ID
    const frontendUrl = process.env.SELF_ORDER_URL || process.env.FRONTEND_URL || 'http://localhost:8084';
    // Check if a Bitly link is provided in the request
    const { bitlyLink } = req.body;
    const qrCodeData = await generateQRCode(
      table._id.toString(),
      qrCode,
      tableNumber,
      frontendUrl,
      bitlyLink || null
    );
    
    table.qrCodeUrl = qrCodeData.qrCodeUrl;
    if (qrCodeData.bitlyLink) {
      table.bitlyLink = qrCodeData.bitlyLink;
    }
    await table.save();

    res.status(201).json({
      success: true,
      table,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   PUT /api/tables/:id
// @desc    Update table
// @access  Private/Admin
router.put('/:id', protect, requireAdmin, async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);
    
    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found',
      });
    }

    const { tableNumber, location, isActive, billingGroupId, bitlyLink, customRedirectEnabled, customRedirectUrl } = req.body;

    if (tableNumber && tableNumber !== table.tableNumber) {
      const existingTable = await Table.findOne({ tableNumber });
      if (existingTable) {
        return res.status(400).json({
          success: false,
          message: 'Table number already exists',
        });
      }
      table.tableNumber = tableNumber;
    }

    if (location !== undefined) table.location = location;
    if (isActive !== undefined) table.isActive = isActive;
    if (billingGroupId !== undefined) table.billingGroupId = billingGroupId || null;
    if (bitlyLink !== undefined) table.bitlyLink = bitlyLink || null;
    if (customRedirectEnabled !== undefined) table.customRedirectEnabled = customRedirectEnabled;
    if (customRedirectUrl !== undefined) table.customRedirectUrl = customRedirectUrl || null;

    await table.save();

    res.json({
      success: true,
      table,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   DELETE /api/tables/:id
// @desc    Delete table
// @access  Private/Admin
router.delete('/:id', protect, requireAdmin, async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);
    
    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found',
      });
    }

    // Delete QR code from S3 if it exists and is an S3 URL
    if (table.qrCodeUrl && table.qrCodeUrl.startsWith('http')) {
      // Extract filename from S3 URL or use table ID
      const fileName = `${table._id}.png`;
      await deleteQRCodeFromS3(fileName);
    }

    await table.deleteOne();

    res.json({
      success: true,
      message: 'Table deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   POST /api/tables/:id/regenerate-qr
// @desc    Regenerate QR code for a table
// @access  Private/Admin
router.post('/:id/regenerate-qr', protect, requireAdmin, async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);
    
    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found',
      });
    }

    // Delete old QR code from S3 if it exists
    if (table.qrCodeUrl && table.qrCodeUrl.startsWith('http')) {
      const fileName = `${table._id}.png`;
      await deleteQRCodeFromS3(fileName);
    }

    // Generate new QR code (reuse existing Bitly link if available)
    const frontendUrl = process.env.SELF_ORDER_URL || process.env.FRONTEND_URL || 'http://localhost:8084';
    const qrCodeData = await generateQRCode(
      table._id.toString(),
      table.qrCode,
      table.tableNumber,
      frontendUrl,
      table.bitlyLink || null
    );
    
    table.qrCodeUrl = qrCodeData.qrCodeUrl;
    if (qrCodeData.bitlyLink) {
      table.bitlyLink = qrCodeData.bitlyLink;
    }
    await table.save();

    res.json({
      success: true,
      table,
      message: 'QR code regenerated successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @route   PUT /api/tables/:id/bitly-link
// @desc    Update or set Bitly link for a table (manually created Bitly link)
// @access  Private/Admin
router.put('/:id/bitly-link', protect, requireAdmin, async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);
    
    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found',
      });
    }

    const { bitlyLink } = req.body;
    
    if (!bitlyLink) {
      return res.status(400).json({
        success: false,
        message: 'bitlyLink is required. This should be the Bitly short link you created manually.',
      });
    }

    // Validate that the Bitly link points to the redirect endpoint
    const backendUrl = process.env.BACKEND_URL || process.env.API_URL || 'http://localhost:7001';
    const expectedRedirectUrl = `${backendUrl}/api/tables/redirect?table=${encodeURIComponent(table.tableNumber)}`;
    
    // Store the Bitly link
    table.bitlyLink = bitlyLink;
    await table.save();

    // Regenerate QR code with the new Bitly link
    const frontendUrl = process.env.SELF_ORDER_URL || process.env.FRONTEND_URL || 'http://localhost:8084';
    const qrCodeData = await generateQRCode(
      table._id.toString(),
      table.qrCode,
      table.tableNumber,
      frontendUrl,
      bitlyLink
    );
    
    table.qrCodeUrl = qrCodeData.qrCodeUrl;
    await table.save();

    res.json({
      success: true,
      table,
      message: 'Bitly link updated and QR code regenerated successfully',
      note: `Make sure your Bitly link points to: ${expectedRedirectUrl}`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
