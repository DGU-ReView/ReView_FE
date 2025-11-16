import { axiosInstance } from '@/apis/axiosInstance';

export const postLogout = async (): Promise<void> => {
  const { data } = await axiosInstance.post<void>('/logout');
  return data;
};
