import type { TMyFeedbackRequest } from '@/types/myPage';

import { getFeedbackDetail } from '@/apis/myPage';

import { useCoreQuery } from '@/hooks/customQuery';

export default function useGetFeedbackdetail({ peerfeedbackId }: TMyFeedbackRequest) {
  const { data } = useCoreQuery(['getFeedbackDetail'], () => getFeedbackDetail({ peerfeedbackId }));
  return { data };
}
