import type { TMyInterviewRequest } from '@/types/myPage';

import { getMyFeedBack } from '@/apis/myPage';

import { useCoreQuery } from '@/hooks/customQuery';

export default function useGetMyFeedback(params: TMyInterviewRequest) {
  const { data } = useCoreQuery(['getMyFeedback'], () => getMyFeedBack(params));
  return { data };
}
