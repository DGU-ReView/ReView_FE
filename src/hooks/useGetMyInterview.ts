import type { TMyInterviewRequest } from '@/types/myPage';

import { getMyInterview } from '@/apis/myPage';

import { useCoreQuery } from '@/hooks/customQuery';

export default function useGetMyInterview(params: TMyInterviewRequest) {
  const { data } = useCoreQuery(['getMyInterview'], () => getMyInterview(params));
  return { data };
}
