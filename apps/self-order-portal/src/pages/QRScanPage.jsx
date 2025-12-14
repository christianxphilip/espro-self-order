import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { tableAPI } from '../services/api';
import useCartStore from '../store/cartStore';

export default function QRScanPage() {
  const { qrCode } = useParams();
  const navigate = useNavigate();
  const setTableId = useCartStore((state) => state.setTableId);

  const { data, isLoading, error } = useQuery({
    queryKey: ['table', qrCode],
    queryFn: () => tableAPI.getByQRCode(qrCode),
    retry: false,
  });

  useEffect(() => {
    if (data?.data?.success && data?.data?.table) {
      const table = data.data.table;
      setTableId(table._id);
      navigate(`/order/table/${table._id}`);
    }
  }, [data, navigate, setTableId]);

  if (isLoading) {
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
