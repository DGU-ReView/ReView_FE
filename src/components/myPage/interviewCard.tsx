import React, { useEffect, useState } from 'react';

import useDeleteInterview from '@/hooks/useDeleteInterview';
import usePatchInterview from '@/hooks/usePatchInterview';

import Delete from '@/assets/delete.svg?react';
import Edit from '@/assets/edit.svg?react';
import Frog from '@/assets/frog.svg?react';
import Check from '@/assets/o.svg?react';

type TCardProps = {
  id: number;
  title: string;
  onClick?: () => void;
};

export default function InterviewCard({ id, title, onClick }: TCardProps) {
  const { mutate: updateTitle } = usePatchInterview();
  const { mutate: deleteInterview } = useDeleteInterview();
  const [isEditing, setIsEditing] = useState(false);
  const [localTitle, setLocalTitle] = useState(title);

  useEffect(() => {
    setLocalTitle(title);
  }, [title]);

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const confirmEdit = () => {
    setIsEditing(false);
    if (localTitle === title) {
      console.log('제목 안 바뀜. PATCH 안 보냄');
      return;
    }

    console.log('PATCH 보냄', { id, localTitle });
    updateTitle({ interviewId: id, title: localTitle });
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      confirmEdit();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      setLocalTitle(title);
      setIsEditing(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteInterview({ sessionId: id });
  };

  return (
    <div
      onClick={onClick}
      className="relative cursor-pointer hover:bg-gray-50 pr-5 w-90 h-50 bg-white flex justify-center items-center rounded-[20px] border border-[#F1F1F1] shadow-[0_7px_14px_0_rgba(234,234,234,1)]"
    >
      <div className="flex items-center justify-center">
        <Frog className="size-25" />
        <div className="flex items-center justify-center gap-2">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                className="font-medium text-xl border-b border-gray-300 outline-none bg-transparent"
                autoFocus
                value={localTitle}
                onChange={(e) => setLocalTitle(e.target.value)}
                onBlur={() => setIsEditing(false)}
                onKeyDown={handleInputKeyDown}
                onClick={(e) => e.stopPropagation()}
              />
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => {
                  e.stopPropagation();
                  confirmEdit();
                }}
              >
                <Check className="size-4 text-[#E95F45]" />
              </button>
            </div>
          ) : (
            <>
              <p className="font-medium text-xl">{title}</p>
              <button type="button" className="p-1 cursor-pointer" onClick={handleEditClick}>
                <Edit className="size-4" />
              </button>
            </>
          )}
        </div>
      </div>

      <button type="button" className="absolute top-5 right-5" onClick={handleDeleteClick}>
        <Delete className="size-5" />
      </button>
    </div>
  );
}
