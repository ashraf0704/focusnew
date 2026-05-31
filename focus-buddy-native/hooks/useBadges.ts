import {useMutation} from '@tanstack/react-query';
import {endpoints} from '@/lib/apiClient';
import {useAppStore} from '@/store/appStore';
import {Badge} from '@/types';

export function useUnlockBadge() {
  const unlockBadge = useAppStore(state => state.unlockBadge);
  return useMutation({
    mutationFn: (id: string) => endpoints.unlockBadge(id) as Promise<Badge>,
    onSuccess: unlockBadge,
  });
}
