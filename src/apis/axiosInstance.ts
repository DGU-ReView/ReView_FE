import axios from 'axios';

import { useModalStore } from '@/stores/modalStore';

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

let hasShown401Modal = false;
let hasShown404Modal = false;

axiosInstance.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error),
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;
    const { openModal, closeModal } = useModalStore.getState();
    if (status === 401) {
      if (!hasShown401Modal) {
        hasShown401Modal = true;
        closeModal();
        openModal('login');
      }

      return Promise.reject(data ?? error);
    }
    if (status === 404 || status === 400) {
      if ((data.errorCode === 'STORAGE_RECORDING_NOT_FOUND' || data.errorCode === 'RECORDING_NOT_FOUND') && !hasShown404Modal) {
        hasShown404Modal = true;
        closeModal();
        openModal('noRecord');
      }
      return Promise.reject(data ?? error);
    }
    if (status === 500) {
      alert('서버 에러가 발생했습니다. 잠시 후 다시 시도해주세요.');
    }

    return Promise.reject(data);
  },
);

export default axiosInstance;
