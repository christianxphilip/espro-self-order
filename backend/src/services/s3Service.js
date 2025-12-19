import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

// Initialize S3 client (only if credentials are available)
let s3Client = null;
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  s3Client = new S3Client({
    region: process.env.AWS_REGION || 'ap-southeast-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
}

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'espro-collective';
const QR_CODE_PREFIX = 'espro-self-order/qrcodes/';

/**
 * Upload QR code image to S3
 * @param {Buffer} imageBuffer - QR code image buffer
 * @param {string} fileName - File name (e.g., tableId.png)
 * @returns {Promise<string>} - S3 public URL
 */
export const uploadQRCodeToS3 = async (imageBuffer, fileName) => {
  if (!s3Client) {
    throw new Error('S3 client not initialized. AWS credentials are required.');
  }
  
  try {
    const key = `${QR_CODE_PREFIX}${fileName}`;
    
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: imageBuffer,
      ContentType: 'image/png',
      // ACL removed - bucket policy should handle public access
      // If bucket is not public, configure bucket policy to allow public read access
    });

    await s3Client.send(command);
    
    // Return the public URL
    const publicUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'ap-southeast-1'}.amazonaws.com/${key}`;
    console.log(`[S3] QR code uploaded to: ${publicUrl}`);
    
    return publicUrl;
  } catch (error) {
    console.error('[S3] Error uploading QR code:', error);
    throw new Error(`Failed to upload QR code to S3: ${error.message}`);
  }
};

/**
 * Delete QR code from S3
 * @param {string} fileName - File name (e.g., tableId.png)
 * @returns {Promise<void>}
 */
export const deleteQRCodeFromS3 = async (fileName) => {
  if (!s3Client) {
    // S3 not configured, skip deletion
    return;
  }
  
  try {
    const key = `${QR_CODE_PREFIX}${fileName}`;
    
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
    console.log(`[S3] QR code deleted: ${key}`);
  } catch (error) {
    console.error('[S3] Error deleting QR code:', error);
    // Don't throw - deletion failures shouldn't break the flow
  }
};
