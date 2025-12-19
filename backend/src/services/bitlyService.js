/**
 * Bitly Service
 * Handles creating and updating Bitly short links for QR codes
 */

const BITLY_API_BASE = 'https://api-ssl.bitly.com/v4';

/**
 * Create a Bitly short link
 * @param {string} longUrl - The URL to shorten
 * @param {string} customSlug - Optional custom slug (using table qrCode)
 * @returns {Promise<{bitlyLink: string, bitlyId: string}>}
 */
export const createBitlyLink = async (longUrl, customSlug = null) => {
  try {
    const accessToken = process.env.BITLY_ACCESS_TOKEN;
    
    if (!accessToken) {
      throw new Error('BITLY_ACCESS_TOKEN environment variable is not set');
    }

    const requestBody = {
      long_url: longUrl,
    };

    // Add custom slug if provided (using table qrCode as the slug)
    if (customSlug) {
      requestBody.custom_bitlinks = [customSlug];
    }

    const response = await fetch(`${BITLY_API_BASE}/shorten`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Bitly API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      bitlyLink: data.link,
      bitlyId: data.id,
    };
  } catch (error) {
    console.error('[Bitly] Error creating short link:', error);
    throw new Error(`Failed to create Bitly link: ${error.message}`);
  }
};

/**
 * Update a Bitly link destination
 * @param {string} bitlyId - The Bitly link ID (e.g., "bit.ly/abc123")
 * @param {string} newLongUrl - The new destination URL
 * @returns {Promise<{bitlyLink: string, bitlyId: string}>}
 */
export const updateBitlyLink = async (bitlyId, newLongUrl) => {
  try {
    const accessToken = process.env.BITLY_ACCESS_TOKEN;
    
    if (!accessToken) {
      throw new Error('BITLY_ACCESS_TOKEN environment variable is not set');
    }

    // Extract the bitlink from bitlyId (format: "bit.ly/abc123" or just "abc123")
    const bitlink = bitlyId.includes('bit.ly/') ? bitlyId : `bit.ly/${bitlyId}`;

    const response = await fetch(`${BITLY_API_BASE}/bitlinks/${bitlink}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        long_url: newLongUrl,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // If link doesn't exist, create a new one
      if (response.status === 404) {
        console.log(`[Bitly] Link ${bitlink} not found, creating new link`);
        return await createBitlyLink(newLongUrl, bitlink.replace('bit.ly/', ''));
      }
      
      throw new Error(errorData.message || `Bitly API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      bitlyLink: data.link,
      bitlyId: data.id,
    };
  } catch (error) {
    console.error('[Bitly] Error updating short link:', error);
    throw new Error(`Failed to update Bitly link: ${error.message}`);
  }
};

/**
 * Get Bitly link information
 * @param {string} bitlyId - The Bitly link ID
 * @returns {Promise<{longUrl: string, bitlyLink: string}>}
 */
export const getBitlyLink = async (bitlyId) => {
  try {
    const accessToken = process.env.BITLY_ACCESS_TOKEN;
    
    if (!accessToken) {
      throw new Error('BITLY_ACCESS_TOKEN environment variable is not set');
    }

    // Extract the bitlink from bitlyId
    const bitlink = bitlyId.includes('bit.ly/') ? bitlyId : `bit.ly/${bitlyId}`;

    const response = await fetch(`${BITLY_API_BASE}/bitlinks/${bitlink}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Bitly API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      longUrl: data.long_url,
      bitlyLink: data.link,
    };
  } catch (error) {
    console.error('[Bitly] Error getting short link:', error);
    throw new Error(`Failed to get Bitly link: ${error.message}`);
  }
};

