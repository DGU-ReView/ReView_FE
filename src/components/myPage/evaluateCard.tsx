import Frog from '@/assets/frog.svg?react';

export default function EvaluateCard(onClick: () => void) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer hover:bg-gray-50 pr-5 w-90 h-50 bg-white flex justify-center items-center rounded-[20px] border border-[#F1F1F1] shadow-[0_7px_14px_0_rgba(234,234,234,1)]"
    >
      <div className="flex items-center justify-center gap-1">
        <Frog className="size-25" />
        <div className="flex flex-col gap-0.5 font-medium text-base">
          <p>
            <span className="text-[#E95F45]">어쩌구</span> 회사의
          </p>
          <p>
            <span className="text-[#E95F45]">저쩌구</span> 직무의 사용자에게
          </p>
          <p>남긴 피드백</p>
        </div>
      </div>
    </div>
  );
}
