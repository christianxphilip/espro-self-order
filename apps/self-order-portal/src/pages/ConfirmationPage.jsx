import { useParams, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { orderAPI } from '../services/api';
import useCartStore from '../store/cartStore';

export default function ConfirmationPage() {
  const { tableId: tableIdParam } = useParams();
  const navigate = useNavigate();
  const { items, customerName, tableId: tableIdFromStore, clearCart } = useCartStore();
  const [requestId, setRequestId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use tableId from store (set during QR scan) or fallback to URL param
  const tableId = tableIdFromStore || tableIdParam;

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Generate unique request ID on component mount
  useEffect(() => {
    // Generate a unique request ID using crypto.randomUUID or fallback
    const generateRequestId = () => {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
      }
      // Fallback for older browsers
      return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}-${Math.random().toString(36).substring(2, 11)}`;
    };
    
    const id = generateRequestId();
    setRequestId(id);
    // Store in sessionStorage for potential retry
    sessionStorage.setItem('pendingOrderRequestId', id);
  }, []);

  const createOrderMutation = useMutation({
    mutationFn: (orderData) => orderAPI.create(orderData),
    onSuccess: (data) => {
      // Clear the pending request ID from sessionStorage
      sessionStorage.removeItem('pendingOrderRequestId');
      setIsSubmitting(false);
      clearCart();
      navigate(`/order-submitted/${data.data.order._id}`);
    },
    onError: (error) => {
      setIsSubmitting(false);
      // Don't clear requestId on error - allow retry with same ID
      alert(error.response?.data?.message || 'Failed to create order. Please try again.');
    },
  });

  const handleConfirm = () => {
    // Prevent multiple submissions
    if (isSubmitting || createOrderMutation.isLoading) {
      console.log('[ConfirmationPage] Order submission already in progress');
      return;
    }

    if (!tableId) {
      alert('Table ID is missing. Please scan the QR code again.');
      navigate('/');
      return;
    }

    if (!customerName || customerName.trim().length < 2) {
      alert('Please enter your name (minimum 2 characters)');
      return;
    }

    if (items.length === 0) {
      alert('Your cart is empty. Please add items to your order.');
      navigate(`/order/table/${tableId}`);
      return;
    }

    // Use requestId from state or generate a new one
    const currentRequestId = requestId || (() => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}-${Math.random().toString(36).substring(2, 11)}`;
      setRequestId(id);
      sessionStorage.setItem('pendingOrderRequestId', id);
      return id;
    })();

    setIsSubmitting(true);

    const orderData = {
      tableId,
      customerName: customerName.trim(),
      items: items.map((item) => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        temperature: item.temperature,
        extraEspresso: item.extraEspresso || false,
        oatMilk: item.oatMilk || false,
      })),
      orderType: 'dine-in',
      requestId: currentRequestId, // Include requestId for idempotency
    };

    console.log('[ConfirmationPage] Submitting order with requestId:', currentRequestId);
    createOrderMutation.mutate(orderData);
  };

  return (
    <div className="min-h-screen bg-espro-cream">
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-espro-dark">Confirm Order</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-espro-dark mb-4">Order Summary</h2>
          <div className="space-y-3 mb-4">
            {items.map((item, index) => {
              // Build modifiers string for display
              const modifiers = [];
              if (item.temperature) {
                modifiers.push(item.temperature === 'iced' ? 'Cold' : 'Hot');
              }
              if (item.extraEspresso) {
                modifiers.push('Extra Espresso');
              }
              if (item.oatMilk) {
                modifiers.push('Oat Milk');
              }
              const modifiersText = modifiers.length > 0 ? ` (${modifiers.join(', ')})` : '';
              
              return (
                <div key={`${item.menuItemId}-${index}`} className="flex justify-between">
                  <span className="text-gray-700">
                    {item.name}{modifiersText} × {item.quantity}
                  </span>
                  <span className="font-semibold">₱{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              );
            })}
          </div>
          <div className="border-t pt-3 flex justify-between items-center">
            <span className="text-lg font-semibold text-espro-dark">Total</span>
            <span className="text-2xl font-bold text-espro-orange">₱{total.toFixed(2)}</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-espro-dark mb-2">Customer Name</h2>
          <p className="text-gray-700">{customerName}</p>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => navigate(`/cart/${tableId}`)}
            className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
          >
            Back to Cart
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSubmitting || createOrderMutation.isLoading}
            className="flex-1 bg-espro-orange text-white py-3 rounded-lg font-semibold hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
          >
            {isSubmitting || createOrderMutation.isLoading ? 'Submitting...' : 'Confirm Order'}
          </button>
        </div>
      </div>
    </div>
  );
}
