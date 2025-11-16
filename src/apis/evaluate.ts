import type { TEvaluateOtherRequest, TEvaluateOtherResponse, TEvaluateresponse } from '@/types/evaluate';

import { axiosInstance } from '@/apis/axiosInstance';

export const getOtherInterview = async (): Promise<TEvaluateOtherResponse> => {
  const { data } = await axiosInstance.get<TEvaluateOtherResponse>('/api/peer-reviews/random');
  return data;
};
export const postOtherInterview = async ({ recordingId, body, followUpQuestion }: TEvaluateOtherRequest): Promise<TEvaluateresponse> => {
  const { data } = await axiosInstance.post<TEvaluateresponse>(`/api/peer-reviews/recordings/${recordingId}/feedbacks`, { body, followUpQuestion });
  return data;
};
