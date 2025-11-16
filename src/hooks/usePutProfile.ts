import { useQueryClient } from '@tanstack/react-query';

import { putProfile } from '@/apis/myPage';

import { useCoreMutation } from '@/hooks/customQuery';

export default function usePutProfile() {
  const queryClient = useQueryClient();
  const { mutate } = useCoreMutation(putProfile, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['getMyProfile'] });
    },
  });
  return { mutate };
}
