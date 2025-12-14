import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { orderAPI } from '../services/api';
import useCartStore from '../store/cartStore';
import { useSettings } from '../hooks/useSettings';

export default function OrderHistoryPage() {
  const navigate = useNavigate();
  const tableId = useCartStore((state) => state.tableId);
  const { getRefetchInterval } = useSettings();

  const { data, isLoading, error } = useQuery({
    queryKey: ['orders', 'table', tableId],
    queryFn: () => orderAPI.getByTable(tableId),
    enabled: !!tableId,
    refetchInterval: getRefetchInterval(10000), // Use settings or default 10 seconds
    retry: 1,
  });

  const orders = data?.data?.orders || [];

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
      case 'confirmed':
        return 'bg-yellow-100 text-yellow-800';
      case 'preparing':
        return 'bg-blue-100 text-blue-800';
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!tableId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-espro-cream p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-espro-dark mb-2">No Table Selected</h1>
          <p className="text-gray-600 mb-4">Please scan a QR code to view your order history.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-espro-orange text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-600"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-espro-cream">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-espro-orange mx-auto mb-4"></div>
          <p className="text-espro-dark">Loading order history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('Error loading order history:', error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-espro-cream p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-6xl mb-4">✕</div>
          <h1 className="text-2xl font-bold text-espro-dark mb-2">Error Loading History</h1>
          <p className="text-gray-600 mb-4">
            {error?.response?.data?.message || error?.message || 'Failed to load order history'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-espro-orange text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-espro-cream">
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-espro-dark">Order History</h1>
            <button
              onClick={() => {
                if (tableId) {
                  navigate(`/order/table/${tableId}`);
                } else {
                  navigate('/');
                }
              }}
              className="bg-espro-orange text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600"
            >
              Back to Menu
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <h2 className="text-xl font-bold text-espro-dark mb-2">No Orders Yet</h2>
            <p className="text-gray-600 mb-4">You haven't placed any orders yet.</p>
            <button
              onClick={() => {
                if (tableId) {
                  navigate(`/order/table/${tableId}`);
                } else {
                  navigate('/');
                }
              }}
              className="bg-espro-orange text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-600"
            >
              Browse Menu
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order._id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer"
                onClick={() => navigate(`/order-submitted/${order._id}`)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-espro-dark mb-1">{order.orderNumber}</h3>
                    <p className="text-sm text-gray-600">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded text-xs font-semibold ${getStatusColor(order.status)}`}>
                    {order.status.toUpperCase()}
                  </span>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-semibold">Customer:</span> {order.customerName}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {order.items?.slice(0, 3).map((item, index) => (
                      <span
                        key={index}
                        className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                      >
                        {item.name} × {item.quantity}
                      </span>
                    ))}
                    {order.items?.length > 3 && (
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                        +{order.items.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  <p className="text-sm text-gray-600">
                    {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xl font-bold text-espro-orange">
                    ₱{order.totalAmount ? order.totalAmount.toFixed(2) : '0.00'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
