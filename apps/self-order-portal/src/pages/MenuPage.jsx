import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { menuAPI, billingGroupAPI } from '../services/api';
import useCartStore from '../store/cartStore';
import MenuCategory from '../components/MenuCategory';
import CartSummary from '../components/CartSummary';
import { useSettings } from '../hooks/useSettings';

export default function MenuPage() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const { items, addItem } = useCartStore();
  const { getRefetchInterval } = useSettings();

  const { data: menuData, isLoading: menuLoading } = useQuery({
    queryKey: ['menu', 'categories'],
    queryFn: () => menuAPI.getByCategories(),
    refetchInterval: getRefetchInterval(30000), // Use settings or default 30 seconds
  });

  const { data: billingData } = useQuery({
    queryKey: ['billing-group', 'active'],
    queryFn: () => billingGroupAPI.getActive(),
    refetchInterval: getRefetchInterval(30000), // Use settings or default 30 seconds
  });

  const menuCategories = menuData?.data?.categories || {};
  const isActive = billingData?.data?.billingGroup?.isActive;

  if (menuLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-espro-cream">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-espro-orange mx-auto mb-4"></div>
          <p className="text-espro-dark">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (!isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-espro-cream p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-espro-dark mb-2">Ordering Unavailable</h1>
          <p className="text-gray-600">
            Self-service ordering is currently disabled. Please contact staff.
          </p>
        </div>
      </div>
    );
  }

  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="min-h-screen bg-espro-cream pb-24">
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-espro-dark">Menu</h1>
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
        {Object.keys(menuCategories).length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No menu items available
          </div>
        ) : (
          Object.entries(menuCategories).map(([category, items]) => (
            <MenuCategory
              key={category}
              category={category}
              items={items}
              onAddItem={addItem}
            />
          ))
        )}
      </div>

      {cartItemCount > 0 && (
        <CartSummary
          itemCount={cartItemCount}
          total={cartTotal}
          onViewCart={() => navigate(`/cart/${tableId}`)}
        />
      )}
    </div>
  );
}
