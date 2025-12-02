import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product, CartItem } from '../types';
import toast from 'react-hot-toast';

interface CartStore {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addToCart: (product, quantity = 1) => {
        const items = get().items;
        const existingItem = items.find(item => item.product.id === product.id);
        
        if (existingItem) {
          set({
            items: items.map(item =>
              item.product.id === product.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            ),
          });
          toast.success('تم تحديث الكمية في السلة');
        } else {
          set({ items: [...items, { product, quantity }] });
          toast.success('تم إضافة المنتج إلى السلة');
        }
      },
      
      removeFromCart: (productId) => {
        set({ items: get().items.filter(item => item.product.id !== productId) });
        toast.success('تم إزالة المنتج من السلة');
      },
      
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(productId);
          return;
        }
        
        set({
          items: get().items.map(item =>
            item.product.id === productId ? { ...item, quantity } : item
          ),
        });
      },
      
      clearCart: () => {
        set({ items: [] });
      },
      
      getTotal: () => {
        return get().items.reduce((total, item) => {
          const price = item.product.discount
            ? item.product.price * (1 - item.product.discount / 100)
            : item.product.price;
          return total + price * item.quantity;
        }, 0);
      },
      
      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: 'chocolate-cart-storage',
    }
  )
);

