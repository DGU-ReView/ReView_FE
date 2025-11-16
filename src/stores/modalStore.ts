import { create } from 'zustand';

export type TModalType = 'alert' | 'login' | 'noRecord';

interface IModalStore {
  isOpen: boolean;
  type: TModalType | null;
  openModal: (type: TModalType) => void;
  closeModal: () => void;
}

export const useModalStore = create<IModalStore>((set) => ({
  isOpen: false,
  type: null,
  openModal: (type) =>
    set({
      isOpen: true,
      type,
    }),
  closeModal: () =>
    set({
      isOpen: false,
      type: null,
    }),
}));
