import type {
  TDeleteRequest,
  TDeleteResponse,
  TMyFeedbackDetailResponse,
  TMyFeedbackRequest,
  TMyFeedbackResponse,
  TMyInterviewRequest,
  TMyInterviewResponse,
  TMyProfileResponse,
  TPatchProfileRequest,
  TPatchProfileResponse,
  TPatchRequest,
} from '@/types/myPage';

import { axiosInstance } from '@/apis/axiosInstance';

export const getMyInterview = async (param: TMyInterviewRequest): Promise<TMyInterviewResponse> => {
  const { data } = await axiosInstance.get<TMyInterviewResponse>('/api/myarchive/myinterviews', {
    params: param,
  });
  return data;
};
export const getMyFeedBack = async (param: TMyInterviewRequest): Promise<TMyFeedbackResponse> => {
  const { data } = await axiosInstance.get<TMyFeedbackResponse>('/api/myarchive/myfeedbacks', {
    params: param,
  });
  return data;
};
export const getProfile = async (): Promise<TMyProfileResponse> => {
  const { data } = await axiosInstance.get<TMyProfileResponse>('/api/myarchive/myprofile');
  return data;
};
export const patchInterview = async ({ interviewId, title }: TPatchRequest): Promise<TMyProfileResponse> => {
  const { data } = await axiosInstance.patch<TMyProfileResponse>(`/api/myarchive/myinterviews/${interviewId}/title`, { title: title });
  return data;
};
export const deleteInterview = async ({ sessionId }: TDeleteRequest): Promise<TDeleteResponse> => {
  const { data } = await axiosInstance.delete<TDeleteResponse>(`/api/myarchive/myinterviews/${sessionId}`);
  return data;
};
export const getFeedbackDetail = async ({ peerfeedbackId }: TMyFeedbackRequest): Promise<TMyFeedbackDetailResponse> => {
  const { data } = await axiosInstance.get<TMyFeedbackDetailResponse>(`/api/myarchive/myfeedbacks/${peerfeedbackId}`);
  return data;
};
export const putProfile = async (param: TPatchProfileRequest): Promise<TPatchProfileResponse> => {
  const { data } = await axiosInstance.put<TPatchProfileResponse>('/api/myarchive/myprofile', param);
  return data;
};
