import type { TUserInfo } from '@/types/user';

import { axiosInstance } from '@/apis/axiosInstance';

export const getUserInfo = async (): Promise<TUserInfo> => {
  const { data } = await axiosInstance.get<TUserInfo>('/api/user/me');
  return data;
};
