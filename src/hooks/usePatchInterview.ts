import { useQueryClient } from '@tanstack/react-query';

import { patchInterview } from '@/apis/myPage';

import { useCoreMutation } from '@/hooks/customQuery';

export default function usePatchInterview() {
  const queryClient = useQueryClient();
  const { mutate } = useCoreMutation(patchInterview, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['getMyInterview'] });
    },
  });
  return { mutate };
}
