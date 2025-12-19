export default function OrderItemStatus({ item, onStatusChange, disabled = false, isLoading = false }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'preparing':
        return 'bg-blue-100 text-blue-800';
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'delivered':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getNextStatus = (currentStatus) => {
    switch (currentStatus) {
      case 'pending':
        return 'preparing';
      case 'preparing':
        return 'ready';
      case 'ready':
        return 'delivered';
      default:
        return currentStatus;
    }
  };

  const canUpdate = item.status !== 'delivered';

  // Get category from populated menuItemId or default to empty string
  const category = item.menuItemId?.category || '';
  
  // Determine if item is a beverage (for barista) or food/snack/dessert (for kitchen)
  const isBeverage = category && ['Beverages', 'beverages', 'Beverage', 'beverage'].includes(category);
  
  // Build modifiers string
  const modifiers = [];
  if (item.temperature) {
    modifiers.push(item.temperature === 'iced' ? 'Iced' : 'Hot');
  }
  if (item.extraEspresso) {
    modifiers.push('Extra Espresso');
  }
  if (item.oatMilk) {
    modifiers.push('Oat Milk');
  }
  const modifiersText = modifiers.length > 0 ? ` (${modifiers.join(', ')})` : '';

  return (
    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
      <div className="flex-1">
        <p className="font-semibold text-espro-dark">
          {item.name} × {item.quantity}{modifiersText}
        </p>
        <p className="text-sm text-gray-600">
          ₱{item.price.toFixed(2)} each • ₱{(item.price * item.quantity).toFixed(2)} total
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(item.status)}`}>
          {item.status.toUpperCase()}
        </span>
        {canUpdate && (
          <button
            onClick={() => onStatusChange(getNextStatus(item.status))}
            disabled={disabled || isLoading}
            className="bg-espro-orange text-white px-3 py-1 rounded text-sm font-semibold hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                <span>Updating...</span>
              </>
            ) : (
              'Next'
            )}
          </button>
        )}
      </div>
    </div>
  );
}
