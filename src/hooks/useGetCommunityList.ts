import type { TCommumityListRequest } from '@/types/community';

import { getCommunityList } from '@/apis/community';

import { useCoreQuery } from '@/hooks/customQuery';

export default function useGetCommunityList(params: TCommumityListRequest) {
  const { data } = useCoreQuery(['getCommunityList'], () => getCommunityList(params));
  return { data };
}
