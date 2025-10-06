import Frog from '@/assets/orangeFrog.svg?react';

export default function CommunityCard() {
  return (
    <div className="cursor-pointer hover:bg-gray-50 pr-5 w-90 h-50 bg-white flex justify-center items-center rounded-[20px] border border-[#F1F1F1] shadow-[0_7px_14px_0_rgba(234,234,234,1)]">
      <div className="flex items-center justify-center gap-1">
        <Frog />
        <div className="flex flex-col gap-2">
          <p className="text-[#8D8D8D] font-normal text-sm">LG CNS - DX Engineer</p>
          <p className="font-semibold text-lg">면접 다녀온썰 푼다</p>
        </div>
      </div>
    </div>
  );
}
