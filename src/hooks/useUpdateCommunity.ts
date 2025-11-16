import { useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import { updateCommunity } from '@/apis/community';

import { useCoreMutation } from '@/hooks/customQuery';

export default function useUpdateCommunity() {
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const { mutate } = useCoreMutation(updateCommunity, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['getCommunityDetail', Number(id)] });
    },
  });
  return { mutate };
}
