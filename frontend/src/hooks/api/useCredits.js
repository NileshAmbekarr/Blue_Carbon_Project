// hooks/api/useCredits.js
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { issueCredits } from '@/services/api/credits';

export const useIssueCredits = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => issueCredits(payload),
    onSuccess: (data) => {
      // Invalidate queries to refetch credit batches and project data
      queryClient.invalidateQueries({ queryKey: ['credits'] });
      queryClient.invalidateQueries({ queryKey: ['projects', data.projectId] });
      // You can also use a toast notification here to show the txHash
      console.log('Issuance initiated. TxHash:', data.txHash);
    },
    onError: (error) => {
      console.error('Failed to issue credits', error);
    },
  });
};