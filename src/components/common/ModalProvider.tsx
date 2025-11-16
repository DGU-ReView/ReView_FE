import type { ReactNode } from 'react';

import { useModalStore } from '@/stores/modalStore';

import ProfileModal from '../myPage/profileModal';

interface IModalProviderProps {
  children: ReactNode;
}

export default function ModalProvider({ children }: IModalProviderProps) {
  const { isOpen, type, closeModal } = useModalStore();

  return (
    <>
      {children}

      {isOpen && type === 'alert' && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" onClick={closeModal}>
          <div
            className="bg-white min-h-10 rounded-lg shadow-[10px_20px_100px_0_rgba(248,161,111,0.2)] border border-[#F8A16F]/5 max-w-150 w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <ProfileModal onClose={closeModal} />
          </div>
        </div>
      )}
    </>
  );
}
