import { useState } from 'react';
import OrderStatusBadge from './OrderStatusBadge';
import OrderTimer from './OrderTimer';
import OrderItemStatus from './OrderItemStatus';

export default function OrderCard({
  order,
  viewMode = 'main', // 'main', 'barista', or 'kitchen'
  onItemStatusChange,
  onOrderStatusChange,
  onStartOrder,
  onCompleteOrder,
  onDispatchOrder,
  isUpdatingItem,
  isUpdatingOrder,
  isStartingOrder,
  isCompletingOrder,
  isDispatchingOrder
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Filter items based on view mode
  const getFilteredItems = () => {
    if (viewMode === 'main') {
      return order.items; // Show all items
    }

    return order.items.filter(item => {
      const category = item.menuItemId?.category || '';
      const isBeverage = category && ['Beverages', 'beverages', 'Beverage', 'beverage'].includes(category);

      if (viewMode === 'barista') {
        return isBeverage;
      } else if (viewMode === 'kitchen') {
        return !isBeverage;
      }
      return true;
    });
  };

  const displayedItems = getFilteredItems();
  const showOrderActions = viewMode === 'main';

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
      case 'confirmed':
        return 'border-yellow-500';
      case 'preparing':
        return 'border-blue-500';
      case 'ready':
        return 'border-green-500';
      default:
        return 'border-gray-300';
    }
  };

  const handleItemStatusChange = (itemId, status) => {
    if (onItemStatusChange) {
      onItemStatusChange(order._id, itemId, status);
    }
  };

  const handleOrderStatusChange = (status) => {
    if (onOrderStatusChange) {
      onOrderStatusChange(order._id, status);
    }
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-md border-l-4 ${getStatusColor(order.status)} transition-all`}
    >
      {/* Header - Always visible */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 cursor-pointer hover:bg-gray-50 transition"
      >
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-bold text-espro-dark">{order.orderNumber}</h3>
            <p className="text-sm text-gray-600">Table {order.tableNumber}</p>
          </div>
          <div className="flex items-center gap-2">
            <OrderStatusBadge status={order.status} />
            <span className="text-gray-400 text-xl">
              {isExpanded ? '▼' : '▶'}
            </span>
          </div>
        </div>

        <div className="mb-2">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Customer:</span> {order.customerName}
          </p>
        </div>

        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600">
              {displayedItems.length} item{displayedItems.length !== 1 ? 's' : ''}
            </p>
            <p className="text-lg font-bold text-espro-orange">
              ₱{order.totalAmount.toFixed(2)}
            </p>
          </div>
          <OrderTimer createdAt={order.createdAt} />
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t pt-4 px-4 pb-4 space-y-4">
          {/* Order Items - Separated by Kitchen and Barista */}
          <div>
            <h4 className="font-semibold text-espro-dark mb-3">Order Items</h4>

            {/* Separate items into Kitchen and Barista sections only in Main View */}
            {viewMode === 'main' ? (
              (() => {
                const kitchenItems = displayedItems.filter(item => {
                  const category = item.menuItemId?.category || '';
                  return category && !['Beverages', 'beverages', 'Beverage', 'beverage'].includes(category);
                });

                const baristaItems = displayedItems.filter(item => {
                  const category = item.menuItemId?.category || '';
                  return category && ['Beverages', 'beverages', 'Beverage', 'beverage'].includes(category);
                });

                return (
                  <div className="space-y-4">
                    {/* Kitchen Section */}
                    {kitchenItems.length > 0 && (
                      <div>
                        <h5 className="text-sm font-semibold text-espro-orange mb-2 uppercase tracking-wide">
                          🍽️ Kitchen
                        </h5>
                        <div className="space-y-2">
                          {kitchenItems.map((item) => (
                            <OrderItemStatus
                              key={item._id}
                              item={item}
                              onStatusChange={(status) => handleItemStatusChange(item._id, status)}
                              disabled={isUpdatingItem}
                              isLoading={isUpdatingItem}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Barista Section */}
                    {baristaItems.length > 0 && (
                      <div>
                        <h5 className="text-sm font-semibold text-blue-600 mb-2 uppercase tracking-wide">
                          ☕ Barista
                        </h5>
                        <div className="space-y-2">
                          {baristaItems.map((item) => (
                            <OrderItemStatus
                              key={item._id}
                              item={item}
                              onStatusChange={(status) => handleItemStatusChange(item._id, status)}
                              disabled={isUpdatingItem}
                              isLoading={isUpdatingItem}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
              /* Barista/Kitchen views: just show items without sections */
              <div className="space-y-2">
                {displayedItems.map((item) => (
                  <OrderItemStatus
                    key={item._id}
                    item={item}
                    onStatusChange={(status) => handleItemStatusChange(item._id, status)}
                    disabled={isUpdatingItem}
                    isLoading={isUpdatingItem}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Order Status Actions - Only shown in Main View */}
          {showOrderActions && (
            <div className="border-t pt-4">
              <h4 className="font-semibold text-espro-dark mb-3">Order Actions</h4>
              <div className="flex flex-wrap gap-2">
                {(order.status === 'pending' || order.status === 'confirmed') && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onStartOrder && !isStartingOrder) {
                        onStartOrder(order._id);
                      }
                    }}
                    disabled={isStartingOrder}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[140px]"
                  >
                    {isStartingOrder && (
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    {isStartingOrder ? 'Starting...' : 'Start Preparing'}
                  </button>
                )}

                {order.status === 'preparing' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onCompleteOrder && !isCompletingOrder) {
                        onCompleteOrder(order._id);
                      }
                    }}
                    disabled={isCompletingOrder}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[140px]"
                  >
                    {isCompletingOrder && (
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    {isCompletingOrder ? 'Completing...' : 'Mark as Ready'}
                  </button>
                )}

                {order.status === 'ready' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onDispatchOrder && !isDispatchingOrder) {
                        onDispatchOrder(order._id);
                      }
                    }}
                    disabled={isDispatchingOrder}
                    className="bg-espro-orange text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[140px]"
                  >
                    {isDispatchingOrder && (
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    {isDispatchingOrder ? 'Dispatching...' : 'Mark as Delivered'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
