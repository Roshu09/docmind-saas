import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getDocuments, deleteDocument } from '../api/files.js';
import toast from 'react-hot-toast';

export const useDocuments = (params = {}) => {
  return useQuery({
    queryKey: ['documents', params],
    queryFn: async () => {
      const { data } = await getDocuments(params);
      return data.data;
    },
    refetchInterval: (data) => {
      const hasProcessing = data?.documents?.some(d => d.status === 'processing' || d.status === 'pending');
      return hasProcessing ? 3000 : false;
    },
  });
};

export const useDeleteDocument = () => {
  const qc = useQueryClient();
  return async (fileId, name) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await deleteDocument(fileId);
      toast.success('Document deleted');
      qc.invalidateQueries({ queryKey: ['documents'] });
    } catch {
      toast.error('Delete failed');
    }
  };
};
