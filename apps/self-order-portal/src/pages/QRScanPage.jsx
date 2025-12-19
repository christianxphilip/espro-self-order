import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { tableAPI, settingsAPI } from '../services/api';
import useCartStore from '../store/cartStore';

export default function QRScanPage() {
  const { qrCode } = useParams();
  const navigate = useNavigate();
  const setTableId = useCartStore((state) => state.setTableId);

  // Check for global custom redirect first
  const { data: settingsData, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['settings', 'public'],
    queryFn: () => settingsAPI.getPublic(),
    retry: false,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['table', qrCode],
    queryFn: () => tableAPI.getByQRCode(qrCode),
    retry: false,
    enabled: !isLoadingSettings && !settingsData?.data?.settings?.customRedirectEnabled, // Only fetch table if custom redirect is not enabled
  });

  // Check for custom redirect on mount
  useEffect(() => {
    if (!isLoadingSettings && settingsData?.data?.settings?.customRedirectEnabled && settingsData?.data?.settings?.customRedirectUrl) {
      window.location.href = settingsData.data.settings.customRedirectUrl;
      return;
    }
  }, [settingsData, isLoadingSettings]);

  useEffect(() => {
    // Only proceed if custom redirect is not enabled
    if (!isLoadingSettings && settingsData?.data?.settings?.customRedirectEnabled) {
      return;
    }

    if (data?.data?.success && data?.data?.table) {
      const table = data.data.table;
      
      // Check for table-specific custom redirect
      if (table.customRedirectEnabled && table.customRedirectUrl) {
        window.location.href = table.customRedirectUrl;
        return;
      }

      setTableId(table._id);
      navigate(`/order/table/${table._id}`);
    }
  }, [data, settingsData, isLoadingSettings, navigate, setTableId]);

  if (isLoadingSettings || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-espro-cream">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-espro-orange mx-auto mb-4"></div>
          <p className="text-espro-dark">Validating QR code...</p>
        </div>
      </div>
    );
  }

  if (error || !data?.data?.success) {
    const errorMessage = error?.response?.data?.message || error?.message || 'Unknown error';
    console.error('QR Scan Error:', error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-espro-cream p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-6xl mb-4">✕</div>
          <h1 className="text-2xl font-bold text-espro-dark mb-2">Invalid QR Code</h1>
          <p className="text-gray-600 mb-4">
            {errorMessage}
          </p>
          <p className="text-sm text-gray-500 mb-4">
            QR Code: {qrCode}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-espro-orange text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return null;
}
