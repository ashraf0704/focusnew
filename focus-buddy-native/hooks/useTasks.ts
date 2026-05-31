import {useMutation, useQueryClient} from '@tanstack/react-query';
import {endpoints} from '@/lib/apiClient';
import {useAppStore} from '@/store/appStore';
import {Priority} from '@/types';

export function useAddTask() {
  const addTask = useAppStore(state => state.addTask);
  return useMutation({
    mutationFn: (data: {title: string; subjectId: string; priority: Priority; dueDate: string}) => endpoints.addTask(data),
    onSuccess: addTask,
  });
}

export function useToggleTask() {
  const {tasks, setTask} = useAppStore();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: endpoints.toggleTask,
    onMutate: id => {
      const current = tasks.find(task => task.id === id);
      if (current) setTask({...current, completed: !current.completed});
      return {current};
    },
    onError: (_error, _id, context) => {
      if (context?.current) setTask(context.current);
    },
    onSuccess: setTask,
    onSettled: () => qc.invalidateQueries({queryKey: ['boot']}),
  });
}

export function useDeleteTask() {
  const deleteTask = useAppStore(state => state.deleteTask);
  return useMutation({
    mutationFn: endpoints.deleteTask,
    onSuccess: (_data, id) => deleteTask(id),
  });
}
