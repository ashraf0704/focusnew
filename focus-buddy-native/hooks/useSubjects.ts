import {useMutation} from '@tanstack/react-query';
import {endpoints} from '@/lib/apiClient';
import {useAppStore} from '@/store/appStore';

export function useAddSubject() {
  const addSubject = useAppStore(state => state.addSubject);
  return useMutation({
    mutationFn: endpoints.addSubject,
    onSuccess: addSubject,
  });
}
