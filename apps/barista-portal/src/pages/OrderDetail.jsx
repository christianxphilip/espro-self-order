import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderAPI, baristaAPI } from '../services/api';
import OrderItemStatus from '../components/OrderItemStatus';
import OrderStatusBadge from '../components/OrderStatusBadge';
import OrderTimer from '../components/OrderTimer';
import { useSettings } from '../hooks/useSettings';

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { getRefetchInterval } = useSettings();

  const { data, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => orderAPI.getById(id),
    refetchInterval: getRefetchInterval(3000), // Use settings or default 3 seconds
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }) => orderAPI.updateStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['order', id]);
      queryClient.invalidateQueries(['barista', 'orders']);
    },
  });

  const updateItemStatusMutation = useMutation({
    mutationFn: ({ orderId, itemId, status }) =>
      orderAPI.updateItemStatus(orderId, itemId, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['order', id]);
    },
  });

  const startOrderMutation = useMutation({
    mutationFn: () => baristaAPI.startOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['order', id]);
      queryClient.invalidateQueries(['barista', 'orders']);
    },
  });

  const completeOrderMutation = useMutation({
    mutationFn: () => baristaAPI.completeOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['order', id]);
      queryClient.invalidateQueries(['barista', 'orders']);
    },
  });

  const dispatchOrderMutation = useMutation({
    mutationFn: () => baristaAPI.dispatchOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['order', id]);
      queryClient.invalidateQueries(['barista', 'orders']);
    },
  });

  const order = data?.data?.order;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-espro-cream flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-espro-orange mx-auto mb-4"></div>
          <p className="text-espro-dark">Loading order...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-espro-cream flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-espro-dark mb-2">Order Not Found</h1>
          <button
            onClick={() => navigate('/')}
            className="mt-4 bg-espro-orange text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-600"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const handleItemStatusChange = (itemId, status) => {
    updateItemStatusMutation.mutate({ orderId: id, itemId, status });
  };

  return (
    <div className="min-h-screen bg-espro-cream pb-6">
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="text-espro-dark hover:text-espro-orange"
            >
              ← Back
            </button>
            <OrderStatusBadge status={order.status} />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-espro-dark mb-2">{order.orderNumber}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>Table {order.tableNumber}</span>
              <span>•</span>
              <span>Customer: {order.customerName}</span>
              <span>•</span>
              <OrderTimer createdAt={order.createdAt} />
            </div>
          </div>

          <div className="border-t pt-4">
            <h2 className="font-semibold text-espro-dark mb-3">Order Items</h2>
            <div className="space-y-3">
              {order.items.map((item) => (
                <OrderItemStatus
                  key={item._id}
                  item={item}
                  onStatusChange={(status) => handleItemStatusChange(item._id, status)}
                />
              ))}
            </div>
          </div>

          <div className="border-t pt-4 mt-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-espro-dark">Total</span>
              <span className="text-2xl font-bold text-espro-orange">
                ₱{order.totalAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="font-semibold text-espro-dark mb-4">Order Actions</h2>
          <div className="flex flex-wrap gap-3">
            {order.status === 'pending' || order.status === 'confirmed' ? (
              <button
                onClick={() => startOrderMutation.mutate()}
                disabled={startOrderMutation.isLoading}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 disabled:bg-gray-300"
              >
                Start Preparing
              </button>
            ) : null}

            {order.status === 'preparing' ? (
              <button
                onClick={() => completeOrderMutation.mutate()}
                disabled={completeOrderMutation.isLoading}
                className="bg-green-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-600 disabled:bg-gray-300"
              >
                Mark as Ready
              </button>
            ) : null}

            {order.status === 'ready' ? (
              <button
                onClick={() => dispatchOrderMutation.mutate()}
                disabled={dispatchOrderMutation.isLoading}
                className="bg-espro-orange text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600 disabled:bg-gray-300"
              >
                Mark as Delivered
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
