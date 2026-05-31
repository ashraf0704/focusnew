import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {endpoints} from '@/lib/apiClient';

export function useVault(folderId?: string | null) {
  const folders = useQuery({queryKey: ['vault-folders'], queryFn: endpoints.listVaultFolders});
  const files = useQuery({queryKey: ['vault-files', folderId], queryFn: () => endpoints.listVaultFiles(folderId)});
  return {folders, files};
}

export function useUploadVaultFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: endpoints.uploadVaultFile,
    onSuccess: () => qc.invalidateQueries({queryKey: ['vault-files']}),
  });
}

export function useCreateVaultFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: endpoints.createVaultFolder,
    onSuccess: () => qc.invalidateQueries({queryKey: ['vault-folders']}),
  });
}

export function useDeleteVaultFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: endpoints.deleteVaultFile,
    onSuccess: () => qc.invalidateQueries({queryKey: ['vault-files']}),
  });
}
