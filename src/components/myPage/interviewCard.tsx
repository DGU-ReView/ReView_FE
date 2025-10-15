import Delete from '@/assets/delete.svg?react';
import Edit from '@/assets/edit.svg?react';
import Frog from '@/assets/orangeFrog.svg?react';

export default function InterviewCard(onClick: () => void) {
  return (
    <div
      onClick={onClick}
      className="relative cursor-pointer hover:bg-gray-50 pr-5 w-90 h-50 bg-white flex justify-center items-center rounded-[20px] border border-[#F1F1F1] shadow-[0_7px_14px_0_rgba(234,234,234,1)]"
    >
      <div className="flex items-center justify-center">
        <Frog className="size-25" />
        <div className="flex items-center justify-center gap-2">
          <p className="font-medium text-xl">2025년 10월 5일</p>
          <Edit className="size-4 cursor-pointer" />
        </div>
      </div>
      <Delete className="absolute top-5 right-5 size-5" />
    </div>
  );
}
