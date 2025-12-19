import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { baristaAPI, orderAPI } from '../services/api';
import OrderCard from '../components/OrderCard';
import BaristaStats from '../components/BaristaStats';
import { useSettings } from '../hooks/useSettings';

export default function BaristaDashboard() {
  const queryClient = useQueryClient();
  const { getRefetchInterval } = useSettings();
  const [statusFilter, setStatusFilter] = useState(null); // null = all active, 'pending', 'preparing', 'ready', 'today'
  const [updatingItemId, setUpdatingItemId] = useState(null); // Track which item is being updated
  const [updatingOrderId, setUpdatingOrderId] = useState(null); // Track which order is being updated

  // Get orders based on filter
  const getOrdersQuery = () => {
    if (statusFilter === 'pending') {
      return baristaAPI.getPendingOrders();
    } else if (statusFilter === 'today') {
      return baristaAPI.getTodayOrders();
    } else if (statusFilter === 'all') {
      return baristaAPI.getAllOrders();
    } else if (statusFilter === 'completed') {
      return baristaAPI.getCompletedOrders();
    } else if (statusFilter === 'preparing' || statusFilter === 'ready') {
      return baristaAPI.getActiveOrders(statusFilter);
    } else {
      return baristaAPI.getActiveOrders();
    }
  };

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['barista', 'orders', statusFilter || 'active'],
    queryFn: getOrdersQuery,
    refetchInterval: getRefetchInterval(3000), // Use settings or default 3 seconds
  });

  const { data: statsData } = useQuery({
    queryKey: ['barista', 'dashboard'],
    queryFn: () => baristaAPI.getDashboard(),
    refetchInterval: getRefetchInterval(5000), // Use settings or default 5 seconds
  });

  const orders = ordersData?.data?.orders || [];
  const stats = statsData?.data?.stats || {};

  // Orders are already filtered by the backend based on statusFilter
  // For 'today' filter, backend returns all orders from today
  // For other filters, backend returns orders matching that status
  const filteredOrders = orders;

  // Mutations for updating order and item statuses
  const updateItemStatusMutation = useMutation({
    mutationFn: ({ orderId, itemId, status }) =>
      orderAPI.updateItemStatus(orderId, itemId, status),
    onMutate: ({ orderId, itemId }) => {
      setUpdatingItemId(`${orderId}-${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['barista', 'orders']);
      queryClient.invalidateQueries(['barista', 'dashboard']);
      setUpdatingItemId(null);
    },
    onError: () => {
      setUpdatingItemId(null);
    },
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: ({ orderId, status }) => orderAPI.updateStatus(orderId, status),
    onMutate: ({ orderId }) => {
      setUpdatingOrderId(orderId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['barista', 'orders']);
      queryClient.invalidateQueries(['barista', 'dashboard']);
      setUpdatingOrderId(null);
    },
    onError: () => {
      setUpdatingOrderId(null);
    },
  });

  const startOrderMutation = useMutation({
    mutationFn: (orderId) => baristaAPI.startOrder(orderId),
    onMutate: (orderId) => {
      setUpdatingOrderId(orderId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['barista', 'orders']);
      queryClient.invalidateQueries(['barista', 'dashboard']);
      setUpdatingOrderId(null);
    },
    onError: () => {
      setUpdatingOrderId(null);
    },
  });

  const completeOrderMutation = useMutation({
    mutationFn: (orderId) => baristaAPI.completeOrder(orderId),
    onMutate: (orderId) => {
      setUpdatingOrderId(orderId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['barista', 'orders']);
      queryClient.invalidateQueries(['barista', 'dashboard']);
      setUpdatingOrderId(null);
    },
    onError: () => {
      setUpdatingOrderId(null);
    },
  });

  const dispatchOrderMutation = useMutation({
    mutationFn: (orderId) => baristaAPI.dispatchOrder(orderId),
    onMutate: (orderId) => {
      setUpdatingOrderId(orderId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['barista', 'orders']);
      queryClient.invalidateQueries(['barista', 'dashboard']);
      setUpdatingOrderId(null);
    },
    onError: () => {
      setUpdatingOrderId(null);
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
        <BaristaStats 
          stats={stats} 
          onStatClick={setStatusFilter}
          selectedFilter={statusFilter}
        />

        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-espro-dark">
              {statusFilter === 'pending' ? 'Pending Orders' :
               statusFilter === 'preparing' ? 'Preparing Orders' :
               statusFilter === 'ready' ? 'Ready Orders' :
               statusFilter === 'today' ? 'Orders Today' :
               statusFilter === 'all' ? 'All Orders' :
               statusFilter === 'completed' ? 'Completed Orders' :
               'Active Orders'}
            </h2>
            {statusFilter && (
              <button
                onClick={() => setStatusFilter(null)}
                className="text-espro-orange hover:text-orange-600 text-sm font-semibold"
              >
                Clear Filter
              </button>
            )}
          </div>
          
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
              No active orders at the moment
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredOrders.map((order) => (
                <OrderCard
                  key={order._id}
                  order={order}
                  onItemStatusChange={handleItemStatusChange}
                  onOrderStatusChange={handleOrderStatusChange}
                  onStartOrder={handleStartOrder}
                  onCompleteOrder={handleCompleteOrder}
                  onDispatchOrder={handleDispatchOrder}
                  isUpdatingItem={updatingItemId?.startsWith(`${order._id}-`)}
                  isUpdatingOrder={updatingOrderId === order._id}
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
