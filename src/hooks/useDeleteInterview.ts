import { useQueryClient } from '@tanstack/react-query';

import { deleteInterview } from '@/apis/myPage';

import { useCoreMutation } from '@/hooks/customQuery';

export default function useDeleteInterview() {
  const queryClient = useQueryClient();
  const { mutate } = useCoreMutation(deleteInterview, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['getMyInterview'] });
    },
  });
  return { mutate };
}
