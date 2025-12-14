import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const useCartStore = create(
  persist(
    (set) => ({
      items: [],
      tableId: null,
      customerName: '',
      
      addItem: (item) => set((state) => {
        const existingItem = state.items.find(
          (i) => i.menuItemId === item.menuItemId
        );
        
        if (existingItem) {
          return {
            items: state.items.map((i) =>
              i.menuItemId === item.menuItemId
                ? { ...i, quantity: i.quantity + (item.quantity || 1) }
                : i
            ),
          };
        }
        
        return {
          items: [...state.items, { ...item, quantity: item.quantity || 1 }],
        };
      }),
      
      removeItem: (menuItemId) => set((state) => ({
        items: state.items.filter((item) => item.menuItemId !== menuItemId),
      })),
      
      updateQuantity: (menuItemId, quantity) => set((state) => ({
        items: state.items.map((item) =>
          item.menuItemId === menuItemId
            ? { ...item, quantity: Math.max(1, quantity) }
            : item
        ),
      })),
      
      setTableId: (tableId) => set({ tableId }),
      
      setCustomerName: (name) => set({ customerName: name }),
      
      clearCart: () => set({ items: [], customerName: '' }),
    }),
    {
      name: 'espro-cart-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useCartStore;
