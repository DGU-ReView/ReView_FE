import { useQueryClient } from '@tanstack/react-query';

import { postCommunity } from '@/apis/community';

import { useCoreMutation } from '@/hooks/customQuery';

export default function usePostCommunity() {
  const queryClient = useQueryClient();
  const { mutate } = useCoreMutation(postCommunity, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['getCommunityList'] });
    },
  });
  return { mutate };
}
