import express from 'express';
import Table from '../models/Table.js';
import { protect, requireAdmin } from '../middleware/auth.js';
import { generateQRCode, generateQRCodeString } from '../services/qrCodeService.js';
import { deleteQRCodeFromS3 } from '../services/s3Service.js';

const router = express.Router();

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

    console.log(`[Tables] Table found: ${table.tableNumber} (${table._id})`);
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
    const { tableNumber, location, billingGroupId } = req.body;

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
    });

    // Generate QR code with actual table ID
    const frontendUrl = process.env.SELF_ORDER_URL || process.env.FRONTEND_URL || 'http://localhost:8084';
    const qrCodeUrl = await generateQRCode(
      table._id.toString(),
      qrCode,
      frontendUrl
    );
    
    table.qrCodeUrl = qrCodeUrl;
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

    const { tableNumber, location, isActive, billingGroupId } = req.body;

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

    // Generate new QR code
    const frontendUrl = process.env.SELF_ORDER_URL || process.env.FRONTEND_URL || 'http://localhost:8084';
    const qrCodeUrl = await generateQRCode(
      table._id.toString(),
      table.qrCode,
      frontendUrl
    );
    
    table.qrCodeUrl = qrCodeUrl;
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

export default router;
