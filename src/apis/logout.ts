import type { AxiosResponse } from 'axios';

import { axiosInstance } from '@/apis/axiosInstance';

export const postLogout = async (): Promise<AxiosResponse> => {
  const { data } = await axiosInstance.post('/logout');
  return data;
};
