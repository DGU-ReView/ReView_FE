import Frog from '@/assets/orangeFrog.svg?react';

type TCommunityCardProps = {
  title?: string;
  onClick?: () => void;
};

export default function CommunityCard({ title, onClick }: TCommunityCardProps) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer hover:bg-gray-50 pr-5 w-90 h-50 bg-white flex justify-center items-center rounded-[20px] border border-[#F1F1F1] shadow-[0_7px_14px_0_rgba(234,234,234,1)]"
    >
      <div className="flex items-center gap-2 max-w-[260px]">
        <Frog className="shrink-0" />
        <p className="font-semibold text-lg break-words  leading-snug line-clamp-3">{title}</p>
      </div>
    </div>
  );
}
