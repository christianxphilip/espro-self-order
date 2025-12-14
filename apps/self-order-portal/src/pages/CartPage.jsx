import { useParams, useNavigate } from 'react-router-dom';
import useCartStore from '../store/cartStore';
import CartItem from '../components/CartItem';

export default function CartPage() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const { items, customerName, setCustomerName, removeItem, updateQuantity, clearCart } = useCartStore();

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleProceed = () => {
    if (customerName.trim().length < 2) {
      alert('Please enter your name (minimum 2 characters)');
      return;
    }
    navigate(`/confirm/${tableId}`);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-espro-cream flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-espro-dark mb-2">Your cart is empty</h1>
          <button
            onClick={() => navigate(`/order/table/${tableId}`)}
            className="mt-4 bg-espro-orange text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-600"
          >
            Browse Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-espro-cream pb-24">
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-espro-dark">Your Cart</h1>
            <button
              onClick={() => navigate('/history')}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 flex items-center gap-2"
            >
              <span>📋</span>
              <span>History</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="space-y-4 mb-6">
          {items.map((item) => (
            <CartItem
              key={item.menuItemId}
              item={item}
              onRemove={() => removeItem(item.menuItemId)}
              onUpdateQuantity={(quantity) => updateQuantity(item.menuItemId, quantity)}
            />
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-espro-dark mb-2">
              Your Name *
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-espro-orange focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Required for order tracking</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-semibold text-espro-dark">Total</span>
            <span className="text-2xl font-bold text-espro-orange">₱{total.toFixed(2)}</span>
          </div>
          <button
            onClick={handleProceed}
            disabled={customerName.trim().length < 2}
            className="w-full bg-espro-orange text-white py-3 rounded-lg font-semibold hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
          >
            Proceed to Confirmation
          </button>
        </div>
      </div>
    </div>
  );
}
