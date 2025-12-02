import { create } from 'zustand';
import { User } from 'firebase/auth';

interface AuthStore {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  setUser: (user: User | null) => void;
  setIsAdmin: (isAdmin: boolean) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAdmin: false,
  loading: true,
  
  setUser: (user) => set({ user }),
  setIsAdmin: (isAdmin) => set({ isAdmin }),
  setLoading: (loading) => set({ loading }),
  
  logout: () => set({ user: null, isAdmin: false }),
}));

