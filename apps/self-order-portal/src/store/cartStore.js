import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const useCartStore = create(
  persist(
    (set) => ({
      items: [],
      tableId: null,
      customerName: '',
      
      addItem: (item) => set((state) => {
        // Check if item with same menuItemId AND same customizations exists
        const existingItem = state.items.find(
          (i) => 
            i.menuItemId === item.menuItemId &&
            i.temperature === (item.temperature || undefined) &&
            i.extraEspresso === (item.extraEspresso || false) &&
            i.oatMilk === (item.oatMilk || false)
        );
        
        if (existingItem) {
          return {
            items: state.items.map((i) =>
              i.menuItemId === item.menuItemId &&
              i.temperature === (item.temperature || undefined) &&
              i.extraEspresso === (item.extraEspresso || false) &&
              i.oatMilk === (item.oatMilk || false)
                ? { ...i, quantity: i.quantity + (item.quantity || 1) }
                : i
            ),
          };
        }
        
        return {
          items: [...state.items, { ...item, quantity: item.quantity || 1 }],
        };
      }),
      
      removeItem: (itemToRemove) => set((state) => {
        // Remove item by matching all properties (including customizations)
        return {
          items: state.items.filter((item) => {
            // If itemToRemove is an object with full item data, match all fields
            if (typeof itemToRemove === 'object' && itemToRemove.menuItemId) {
              return !(
                item.menuItemId === itemToRemove.menuItemId &&
                item.temperature === (itemToRemove.temperature || undefined) &&
                item.extraEspresso === (itemToRemove.extraEspresso || false) &&
                item.oatMilk === (itemToRemove.oatMilk || false)
              );
            }
            // If itemToRemove is just menuItemId (backward compatibility), match by ID only
            return item.menuItemId !== itemToRemove;
          }),
        };
      }),
      
      updateQuantity: (itemToUpdate, quantity) => set((state) => ({
        items: state.items.map((item) => {
          // If itemToUpdate is an object with full item data, match all fields
          if (typeof itemToUpdate === 'object' && itemToUpdate.menuItemId) {
            if (
              item.menuItemId === itemToUpdate.menuItemId &&
              item.temperature === (itemToUpdate.temperature || undefined) &&
              item.extraEspresso === (itemToUpdate.extraEspresso || false) &&
              item.oatMilk === (itemToUpdate.oatMilk || false)
            ) {
              return { ...item, quantity: Math.max(1, quantity) };
            }
          } else if (item.menuItemId === itemToUpdate) {
            // Backward compatibility: if itemToUpdate is just menuItemId
            return { ...item, quantity: Math.max(1, quantity) };
          }
          return item;
        }),
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
