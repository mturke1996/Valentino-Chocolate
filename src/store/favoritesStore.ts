import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '../types';
import toast from 'react-hot-toast';

interface FavoritesStore {
  items: Product[];
  addToFavorites: (product: Product) => void;
  removeFromFavorites: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
  getFavoritesCount: () => number;
  clearFavorites: () => void;
}

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addToFavorites: (product) => {
        const items = get().items;
        if (items.find(item => item.id === product.id)) {
          toast.error('المنتج موجود بالفعل في المفضلة');
          return;
        }
        set({ items: [...items, product] });
        toast.success('تم إضافة المنتج إلى المفضلة');
      },
      
      removeFromFavorites: (productId) => {
        set({ items: get().items.filter(item => item.id !== productId) });
        toast.success('تم إزالة المنتج من المفضلة');
      },
      
      isFavorite: (productId) => {
        return get().items.some(item => item.id === productId);
      },
      
      getFavoritesCount: () => {
        return get().items.length;
      },
      
      clearFavorites: () => {
        set({ items: [] });
      },
    }),
    {
      name: 'chocolate-favorites-storage',
    }
  )
);

