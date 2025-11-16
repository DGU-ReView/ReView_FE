import Frog from '@/assets/frog.svg?react';

type TEvaluateCardProps = {
  title: string;
  onClick: () => void;
};
export default function EvaluateCard({ title, onClick }: TEvaluateCardProps) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer hover:bg-gray-50 pr-5 w-90 h-50 bg-white flex justify-center items-center rounded-[20px] border border-[#F1F1F1] shadow-[0_7px_14px_0_rgba(234,234,234,1)]"
    >
      <div className="flex items-center justify-center gap-1">
        <Frog className="size-25" />
        <div className="flex flex-col gap-0.5 font-medium text-base">
          <p className="text-[#E95F45]">{title}</p>
          <p> 직무의 사용자에게 남긴 피드백</p>
        </div>
      </div>
    </div>
  );
}
