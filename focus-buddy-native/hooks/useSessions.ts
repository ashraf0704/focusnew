import {useMutation} from '@tanstack/react-query';
import {endpoints} from '@/lib/apiClient';
import {useAppStore} from '@/store/appStore';
import {useAuthStore} from '@/store/authStore';

export function useFinishSession() {
  const addSessionLog = useAppStore(state => state.addSessionLog);
  const setProfile = useAuthStore(state => state.setProfile);
  return useMutation({
    mutationFn: endpoints.finishSession,
    onSuccess: result => {
      addSessionLog(result.log);
      setProfile(result.profile);
    },
  });
}
