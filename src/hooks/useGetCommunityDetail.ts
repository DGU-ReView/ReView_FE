import type { TCommumityDetailRequest } from '@/types/community';

import { getCommunityDetail } from '@/apis/community';

import { useCoreQuery } from '@/hooks/customQuery';

export default function useGetCommunityDetail(param: TCommumityDetailRequest) {
  const { data } = useCoreQuery(['getCommunityDetail', param.pageId], () => getCommunityDetail(param));
  return { data };
}
