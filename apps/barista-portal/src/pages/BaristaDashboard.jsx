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
  const [viewTab, setViewTab] = useState('main'); // 'main', 'barista' or 'kitchen'
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

  // Filter orders based on viewTab
  // Orders are already filtered by the backend based on statusFilter
  // For 'today' filter, backend returns all orders from today
  // For other filters, backend returns orders matching that status
  const filteredOrders = orders.filter(order => {
    // Main view shows all orders
    if (viewTab === 'main') {
      return true;
    }

    // Barista/Kitchen views only show orders that have relevant items
    const hasRelevantItems = order.items.some(item => {
      const category = item.menuItemId?.category || '';
      const isBeverage = category && ['Beverages', 'beverages', 'Beverage', 'beverage'].includes(category);

      if (viewTab === 'barista') {
        return isBeverage;
      } else {
        // kitchen view: show food, snacks, desserts (non-beverages)
        return !isBeverage;
      }
    });

    return hasRelevantItems;
  });

  // Mutations for updating order and item statuses
  const updateItemStatusMutation = useMutation({
    mutationFn: ({ orderId, itemId, status }) =>
      orderAPI.updateItemStatus(orderId, itemId, status),
    onMutate: ({ orderId, itemId }) => {
      setUpdatingItemId(`${orderId}-${itemId}`);
    },
    onSuccess: async () => {
      // Wait for queries to refetch before clearing loading state
      await queryClient.invalidateQueries(['barista', 'orders']);
      await queryClient.invalidateQueries(['barista', 'dashboard']);
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
    onSuccess: async () => {
      // Wait for queries to refetch before clearing loading state
      await queryClient.invalidateQueries(['barista', 'orders']);
      await queryClient.invalidateQueries(['barista', 'dashboard']);
      setUpdatingOrderId(null);
    },
    onError: () => {
      setUpdatingOrderId(null);
    },
  });

  // Use Sets to track multiple orders being processed simultaneously
  const [startingOrderIds, setStartingOrderIds] = useState(new Set());
  const [completingOrderIds, setCompletingOrderIds] = useState(new Set());
  const [dispatchingOrderIds, setDispatchingOrderIds] = useState(new Set());

  const startOrderMutation = useMutation({
    mutationFn: (orderId) => baristaAPI.startOrder(orderId),
    onMutate: (orderId) => {
      setStartingOrderIds(prev => new Set(prev).add(orderId));
      setUpdatingOrderId(orderId);
    },
    onSuccess: async (data, orderId) => {
      // Wait for queries to refetch before clearing loading state
      await queryClient.invalidateQueries(['barista', 'orders']);
      await queryClient.invalidateQueries(['barista', 'dashboard']);

      // Remove this specific order from loading state
      setStartingOrderIds(prev => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
      setUpdatingOrderId(null);
    },
    onError: (error, orderId) => {
      setStartingOrderIds(prev => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
      setUpdatingOrderId(null);
    },
  });

  const completeOrderMutation = useMutation({
    mutationFn: (orderId) => baristaAPI.completeOrder(orderId),
    onMutate: (orderId) => {
      setCompletingOrderIds(prev => new Set(prev).add(orderId));
      setUpdatingOrderId(orderId);
    },
    onSuccess: async (data, orderId) => {
      // Wait for queries to refetch before clearing loading state
      await queryClient.invalidateQueries(['barista', 'orders']);
      await queryClient.invalidateQueries(['barista', 'dashboard']);

      // Remove this specific order from loading state
      setCompletingOrderIds(prev => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
      setUpdatingOrderId(null);
    },
    onError: (error, orderId) => {
      setCompletingOrderIds(prev => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
      setUpdatingOrderId(null);
    },
  });

  const dispatchOrderMutation = useMutation({
    mutationFn: (orderId) => baristaAPI.dispatchOrder(orderId),
    onMutate: (orderId) => {
      setDispatchingOrderIds(prev => new Set(prev).add(orderId));
      setUpdatingOrderId(orderId);
    },
    onSuccess: async (data, orderId) => {
      // Wait for queries to refetch before clearing loading state
      await queryClient.invalidateQueries(['barista', 'orders']);
      await queryClient.invalidateQueries(['barista', 'dashboard']);

      // Remove this specific order from loading state
      setDispatchingOrderIds(prev => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
      setUpdatingOrderId(null);
    },
    onError: (error, orderId) => {
      setDispatchingOrderIds(prev => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
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

        {/* View Tabs */}
        <div className="max-w-7xl mx-auto px-4 pb-2">
          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setViewTab('main')}
              className={`px-6 py-3 font-semibold text-sm transition-all ${viewTab === 'main'
                ? 'text-gray-900 border-b-2 border-gray-900 bg-gray-100'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
            >
              📋 Main View
            </button>
            <button
              onClick={() => setViewTab('barista')}
              className={`px-6 py-3 font-semibold text-sm transition-all ${viewTab === 'barista'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-blue-500 hover:bg-gray-50'
                }`}
            >
              ☕ Barista View
            </button>
            <button
              onClick={() => setViewTab('kitchen')}
              className={`px-6 py-3 font-semibold text-sm transition-all ${viewTab === 'kitchen'
                ? 'text-espro-orange border-b-2 border-espro-orange bg-orange-50'
                : 'text-gray-600 hover:text-espro-orange hover:bg-gray-50'
                }`}
            >
              🍽️ Kitchen View
            </button>
          </div>
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
                  viewMode={viewTab}
                  onItemStatusChange={handleItemStatusChange}
                  onOrderStatusChange={handleOrderStatusChange}
                  onStartOrder={handleStartOrder}
                  onCompleteOrder={handleCompleteOrder}
                  onDispatchOrder={handleDispatchOrder}
                  isUpdatingItem={updatingItemId?.startsWith(`${order._id}-`)}
                  isUpdatingOrder={updatingOrderId === order._id}
                  isStartingOrder={startingOrderIds.has(order._id)}
                  isCompletingOrder={completingOrderIds.has(order._id)}
                  isDispatchingOrder={dispatchingOrderIds.has(order._id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
