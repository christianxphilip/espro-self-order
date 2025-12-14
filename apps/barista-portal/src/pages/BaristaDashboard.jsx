import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { baristaAPI, orderAPI } from '../services/api';
import OrderCard from '../components/OrderCard';
import BaristaStats from '../components/BaristaStats';
import { useSettings } from '../hooks/useSettings';

export default function BaristaDashboard() {
  const queryClient = useQueryClient();
  const { getRefetchInterval } = useSettings();

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['barista', 'orders', 'active'],
    queryFn: () => baristaAPI.getActiveOrders(),
    refetchInterval: getRefetchInterval(3000), // Use settings or default 3 seconds
  });

  const { data: statsData } = useQuery({
    queryKey: ['barista', 'dashboard'],
    queryFn: () => baristaAPI.getDashboard(),
    refetchInterval: getRefetchInterval(5000), // Use settings or default 5 seconds
  });

  const orders = ordersData?.data?.orders || [];
  const stats = statsData?.data?.stats || {};

  // Mutations for updating order and item statuses
  const updateItemStatusMutation = useMutation({
    mutationFn: ({ orderId, itemId, status }) =>
      orderAPI.updateItemStatus(orderId, itemId, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['barista', 'orders', 'active']);
      queryClient.invalidateQueries(['barista', 'dashboard']);
    },
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: ({ orderId, status }) => orderAPI.updateStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['barista', 'orders', 'active']);
      queryClient.invalidateQueries(['barista', 'dashboard']);
    },
  });

  const startOrderMutation = useMutation({
    mutationFn: (orderId) => baristaAPI.startOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries(['barista', 'orders', 'active']);
      queryClient.invalidateQueries(['barista', 'dashboard']);
    },
  });

  const completeOrderMutation = useMutation({
    mutationFn: (orderId) => baristaAPI.completeOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries(['barista', 'orders', 'active']);
      queryClient.invalidateQueries(['barista', 'dashboard']);
    },
  });

  const dispatchOrderMutation = useMutation({
    mutationFn: (orderId) => baristaAPI.dispatchOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries(['barista', 'orders', 'active']);
      queryClient.invalidateQueries(['barista', 'dashboard']);
    },
  });

  const handleItemStatusChange = (orderId, itemId, status) => {
    updateItemStatusMutation.mutate({ orderId, itemId, status });
  };

  const handleOrderStatusChange = (orderId, status) => {
    updateOrderStatusMutation.mutate({ orderId, status });
  };

  const handleStartOrder = (orderId) => {
    startOrderMutation.mutate(orderId);
  };

  const handleCompleteOrder = (orderId) => {
    completeOrderMutation.mutate(orderId);
  };

  const handleDispatchOrder = (orderId) => {
    dispatchOrderMutation.mutate(orderId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-espro-cream flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-espro-orange mx-auto mb-4"></div>
          <p className="text-espro-dark">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-espro-cream">
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold text-espro-dark">Barista Dashboard</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <BaristaStats stats={stats} />

        <div className="mt-6">
          <h2 className="text-2xl font-bold text-espro-dark mb-4">Active Orders</h2>
          
          {orders.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
              No active orders at the moment
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {orders.map((order) => (
                <OrderCard
                  key={order._id}
                  order={order}
                  onItemStatusChange={handleItemStatusChange}
                  onOrderStatusChange={handleOrderStatusChange}
                  onStartOrder={handleStartOrder}
                  onCompleteOrder={handleCompleteOrder}
                  onDispatchOrder={handleDispatchOrder}
                  isUpdatingItem={updateItemStatusMutation.isLoading}
                  isUpdatingOrder={updateOrderStatusMutation.isLoading}
                  isStartingOrder={startOrderMutation.isLoading && startOrderMutation.variables === order._id}
                  isCompletingOrder={completeOrderMutation.isLoading && completeOrderMutation.variables === order._id}
                  isDispatchingOrder={dispatchOrderMutation.isLoading && dispatchOrderMutation.variables === order._id}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
