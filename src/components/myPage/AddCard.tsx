import Add from '@/assets/add.svg?react';

export default function AddCard() {
  return (
    <div className="cursor-pointer hover:bg-gray-50 pr-5 w-90 h-50 bg-white/50 flex justify-center items-center rounded-[20px] border border-[#F1F1F1] shadow-[0_7px_14px_0_rgba(234,234,234,1)]">
      <div className="flex items-center justify-center">
        <Add />
      </div>
    </div>
  );
}
