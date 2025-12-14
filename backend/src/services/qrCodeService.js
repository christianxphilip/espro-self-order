import QRCode from 'qrcode';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate QR code for a table
 * @param {string} tableId - Table ID
 * @param {string} qrCode - QR code string
 * @param {string} frontendUrl - Frontend URL for QR code link
 * @returns {Promise<string>} - Path to QR code image
 */
export const generateQRCode = async (tableId, qrCode, frontendUrl) => {
  try {
    if (!tableId) {
      throw new Error('Table ID is required to generate QR code');
    }

    // Use the QR code string for the URL path instead of tableId
    const qrData = `${frontendUrl}/scan/${qrCode}`;
    const uploadDir = path.join(__dirname, '../../uploads/qrcodes');
    
    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log(`[QR Code] Created directory: ${uploadDir}`);
    }
    
    const qrCodePath = path.join(uploadDir, `${tableId}.png`);
    
    console.log(`[QR Code] Generating QR code for table ${tableId}`);
    console.log(`[QR Code] QR Data: ${qrData}`);
    console.log(`[QR Code] Save path: ${qrCodePath}`);
    
    await QRCode.toFile(qrCodePath, qrData, {
      errorCorrectionLevel: 'H',
      type: 'png',
      width: 300,
      margin: 1,
    });
    
    console.log(`[QR Code] Successfully generated QR code at ${qrCodePath}`);
    
    // Return the URL path that can be accessed via the /uploads static route
    const qrCodeUrl = `/uploads/qrcodes/${tableId}.png`;
    return qrCodeUrl;
  } catch (error) {
    console.error('[QR Code] Error generating QR code:', error);
    throw new Error(`Failed to generate QR code: ${error.message}`);
  }
};

/**
 * Generate unique QR code string
 * @returns {string} - Unique QR code string
 */
export const generateQRCodeString = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `TBL-${timestamp}-${random}`.toUpperCase();
};
