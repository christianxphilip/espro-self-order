import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { orderAPI } from '../services/api';
import useCartStore from '../store/cartStore';
import { useSettings } from '../hooks/useSettings';

export default function OrderSubmittedPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const tableId = useCartStore((state) => state.tableId);
  const setTableId = useCartStore((state) => state.setTableId);
  const { getRefetchInterval } = useSettings();

  const { data, isLoading, error } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => orderAPI.getById(orderId),
    refetchInterval: getRefetchInterval(5000), // Use settings or default 5 seconds
    retry: 1,
  });

  const order = data?.data?.order;
  
  // Use tableId from order if not in store (for direct navigation)
  // Ensure tableId is always a string (not an ObjectId object)
  const effectiveTableId = tableId || (order?.tableId ? String(order.tableId) : null);

  // Fetch past orders for this table
  const { data: pastOrdersData } = useQuery({
    queryKey: ['orders', 'table', effectiveTableId],
    queryFn: () => orderAPI.getByTable(effectiveTableId),
    enabled: !!effectiveTableId,
    refetchInterval: getRefetchInterval(10000), // Use settings or default 10 seconds
    retry: 1,
  });

  const pastOrders = pastOrdersData?.data?.orders || [];

  // Store tableId from order if not already in store
  useEffect(() => {
    if (order?.tableId && !tableId) {
      // Ensure tableId is stored as a string
      const tableIdString = String(order.tableId);
      setTableId(tableIdString);
    }
  }, [order?.tableId, tableId, setTableId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-espro-cream">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-espro-orange mx-auto mb-4"></div>
          <p className="text-espro-dark">Loading order...</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('Error loading order:', error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-espro-cream p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-6xl mb-4">✕</div>
          <h1 className="text-2xl font-bold text-espro-dark mb-2">Error Loading Order</h1>
          <p className="text-gray-600 mb-4">
            {error?.response?.data?.message || error?.message || 'Failed to load order'}
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

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-espro-cream p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-espro-dark mb-2">Order Not Found</h1>
          <p className="text-gray-600 mb-4">The order you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

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

  const handleOrderAgain = () => {
    const targetTableId = effectiveTableId;
    if (targetTableId) {
      // Ensure tableId is stored in cart store as a string
      useCartStore.getState().setTableId(String(targetTableId));
      navigate(`/order/table/${targetTableId}`);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Filter out the current order from past orders
  const otherOrders = pastOrders.filter((o) => o._id !== orderId);

  return (
    <div className="min-h-screen bg-espro-cream p-4">
      <div className="max-w-2xl mx-auto">
        {/* Current Order Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6 text-center">
          <div className="text-green-500 text-6xl mb-4">✓</div>
          <h1 className="text-2xl font-bold text-espro-dark mb-2">Order Submitted!</h1>
          <p className="text-gray-600 mb-4">Your order has been received</p>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-4 text-left">
            <div className="mb-2">
              <span className="text-sm text-gray-600">Order Number:</span>
              <p className="font-semibold text-espro-dark">{order.orderNumber}</p>
            </div>
            <div className="mb-2">
              <span className="text-sm text-gray-600">Status:</span>
              <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${getStatusColor(order.status)}`}>
                {order.status.toUpperCase()}
              </span>
            </div>
            <div className="mb-2">
              <span className="text-sm text-gray-600">Items:</span>
              <p className="font-semibold text-espro-dark">
                {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Total:</span>
              <p className="font-bold text-espro-orange text-lg">
                ₱{order.totalAmount ? order.totalAmount.toFixed(2) : '0.00'}
              </p>
            </div>
          </div>

          <p className="text-sm text-gray-500 mb-4">
            Your order will be prepared shortly. Status updates automatically.
          </p>

          <div className="flex gap-3 justify-center flex-wrap">
            <button
              onClick={handleOrderAgain}
              className="bg-espro-orange text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-600"
            >
              Order Again
            </button>
            <button
              onClick={() => navigate('/history')}
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300"
            >
              View History
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Past Orders Section */}
        {otherOrders.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-espro-dark mb-4">Past Orders</h2>
            <div className="space-y-3">
              {otherOrders.map((pastOrder) => (
                <div
                  key={pastOrder._id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-espro-dark">{pastOrder.orderNumber || 'N/A'}</p>
                      <p className="text-sm text-gray-600">
                        {pastOrder.createdAt ? formatDate(pastOrder.createdAt) : 'Unknown date'}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(pastOrder.status)}`}>
                      {pastOrder.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-sm text-gray-600">
                      {pastOrder.items?.length || 0} item{(pastOrder.items?.length || 0) !== 1 ? 's' : ''} • {pastOrder.customerName || 'Unknown'}
                    </p>
                    <p className="font-bold text-espro-orange">
                      ₱{pastOrder.totalAmount ? pastOrder.totalAmount.toFixed(2) : '0.00'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
