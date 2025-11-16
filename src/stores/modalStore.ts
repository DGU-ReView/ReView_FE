import { create } from 'zustand';

export type TModalType = 'alert';

interface IModalStore {
  isOpen: boolean;
  type: TModalType | null;
  openModal: (type: TModalType) => void;
  closeModal: () => void;
}

export const useModalStore = create<IModalStore>((set: any) => ({
  isOpen: false,
  type: null,
  openModal: (type: TModalType) =>
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
