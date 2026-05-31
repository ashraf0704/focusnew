import {create} from 'zustand';
import * as SecureStore from 'expo-secure-store';
import {JWT_KEY} from '@/lib/apiClient';
import {UserProfile} from '@/types';

interface AuthState {
  jwt: string | null;
  profile: UserProfile | null;
  setJwt: (jwt: string) => Promise<void>;
  setProfile: (profile: UserProfile) => void;
  updateProfile: (partial: Partial<UserProfile>) => void;
  clearAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  jwt: null,
  profile: null,
  setJwt: async jwt => {
    await SecureStore.setItemAsync(JWT_KEY, jwt);
    set({jwt});
  },
  setProfile: profile => set({profile}),
  updateProfile: partial => {
    const current = get().profile;
    if (current) set({profile: {...current, ...partial}});
  },
  clearAuth: async () => {
    await SecureStore.deleteItemAsync(JWT_KEY);
    set({jwt: null, profile: null});
  },
}));
