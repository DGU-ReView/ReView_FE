import { getUserInfo } from '@/apis/user';

import { useCoreQuery } from '@/hooks/customQuery';

export default function useGetUser() {
  const { data } = useCoreQuery(['getUserInfo'], () => getUserInfo());
  return { data };
}
