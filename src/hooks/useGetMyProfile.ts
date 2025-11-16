import { getProfile } from '@/apis/myPage';

import { useCoreQuery } from '@/hooks/customQuery';

export default function useGetMyProfile() {
  const { data } = useCoreQuery(['getMyProfile'], () => getProfile());
  return { data };
}
