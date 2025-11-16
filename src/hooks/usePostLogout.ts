import { postLogout } from '@/apis/logout';

import { useCoreMutation } from '@/hooks/customQuery';

export default function usePostLogout() {
  const { mutate } = useCoreMutation(postLogout, {
    onSuccess: () => {
      window.location.replace('/');
      localStorage.clear();
    },
  });
  return { mutate };
}
