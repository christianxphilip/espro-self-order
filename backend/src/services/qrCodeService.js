import QRCode from 'qrcode';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { uploadQRCodeToS3 } from './s3Service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate QR code for a table
 * @param {string} tableId - Table ID
 * @param {string} qrCode - QR code string
 * @param {string} tableNumber - Table number
 * @param {string} frontendUrl - Frontend URL for QR code link
 * @param {string} bitlyLink - Optional manually created Bitly link to use in QR code
 * @returns {Promise<{qrCodeUrl: string, bitlyLink: string}>} - QR code image URL and Bitly link info
 */
export const generateQRCode = async (tableId, qrCode, tableNumber, frontendUrl, bitlyLink = null) => {
  try {
    if (!tableId) {
      throw new Error('Table ID is required to generate QR code');
    }

    console.log(`[QR Code] Generating QR code for table ${tableId} (${tableNumber})`);
    
    // If a Bitly link is provided, use it; otherwise use direct self-order portal URL
    // The QR code will point to the self-order portal, which will check settings
    // and redirect to custom URL if enabled
    const directUrl = `${frontendUrl}/scan/${qrCode}`;
    const qrData = bitlyLink || directUrl;
    
    if (bitlyLink) {
      console.log(`[QR Code] Using provided Bitly link: ${bitlyLink}`);
    } else {
      console.log(`[QR Code] Using direct self-order portal URL: ${directUrl}`);
    }
    
    // Generate QR code as buffer
    const qrCodeBuffer = await QRCode.toBuffer(qrData, {
      errorCorrectionLevel: 'H',
      type: 'png',
      width: 300,
      margin: 1,
    });
    
    // Check if S3 is configured
    const useS3 = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY;
    
    let qrCodeUrl;
    if (useS3) {
      // Upload to S3
      const fileName = `${tableId}.png`;
      qrCodeUrl = await uploadQRCodeToS3(qrCodeBuffer, fileName);
      console.log(`[QR Code] Successfully uploaded QR code to S3: ${qrCodeUrl}`);
    } else {
      // Fallback to local storage
      const uploadDir = path.join(__dirname, '../../uploads/qrcodes');
      
      // Ensure directory exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
        console.log(`[QR Code] Created directory: ${uploadDir}`);
      }
      
      const qrCodePath = path.join(uploadDir, `${tableId}.png`);
      fs.writeFileSync(qrCodePath, qrCodeBuffer);
      
      console.log(`[QR Code] Successfully generated QR code at ${qrCodePath}`);
      
      // Return the URL path that can be accessed via the /uploads static route
      qrCodeUrl = `/uploads/qrcodes/${tableId}.png`;
    }
    
    // Return QR code image URL and Bitly link info
    return {
      qrCodeUrl,
      bitlyLink: bitlyLink || null,
    };
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
