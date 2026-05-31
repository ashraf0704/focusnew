import {useMutation, useQuery} from '@tanstack/react-query';
import {endpoints} from '@/lib/apiClient';
import {useAuthStore} from '@/store/authStore';
import {UserProfile} from '@/types';

export function useBootProfile() {
  return useQuery({
    queryKey: ['boot'],
    queryFn: endpoints.boot,
    enabled: false,
    retry: false,
    gcTime: 0,
  });
}

export function useUpdateProfile() {
  const setProfile = useAuthStore(state => state.setProfile);
  return useMutation({
    mutationFn: (data: Partial<UserProfile>) => endpoints.updateProfile(data),
    onSuccess: profile => setProfile(profile),
  });
}
