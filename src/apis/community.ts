import type {
  TCommumityDetailRequest,
  TCommumityDetailResponse,
  TCommumityListRequest,
  TCommumityListResponse,
  TCommunityEditRequest,
  TCommunityPostRequest,
} from '@/types/community';

import { axiosInstance } from '@/apis/axiosInstance';

export const getCommunityList = async (param: TCommumityListRequest): Promise<TCommumityListResponse> => {
  const { data } = await axiosInstance.get('/api/community/pages', {
    params: param,
  });
  return data;
};
export const postCommunity = async (param: TCommunityPostRequest): Promise<TCommumityListResponse> => {
  const { data } = await axiosInstance.post('/api/community/pages', param);
  return data;
};
export const getCommunityDetail = async ({ pageId }: TCommumityDetailRequest): Promise<TCommumityDetailResponse> => {
  const { data } = await axiosInstance.get(`/api/community/pages/${pageId}`);
  return data;
};
export const updateCommunity = async (param: TCommunityEditRequest): Promise<TCommumityDetailResponse> => {
  const { data } = await axiosInstance.patch(`/api/community/pages/${param.pageId}`, param);
  return data;
};
