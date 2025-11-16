import { useQueryClient } from '@tanstack/react-query';

import { postOtherInterview } from '@/apis/evaluate';

import { useCoreMutation } from '@/hooks/customQuery';

import { route } from '@/routes/route';

export default function usePostOtherInterview() {
  const queryClient = useQueryClient();
  const { mutate } = useCoreMutation(postOtherInterview, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['getMyFeedback'] });
      window.location.replace(route.evaluate);
    },
  });
  return { mutate };
}
