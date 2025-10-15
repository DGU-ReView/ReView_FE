import CommunityIcon from '@/assets/communityIcon.svg?react';
import MyIcon from '@/assets/myIcon.svg?react';
import MyPageIcon from '@/assets/myPageIcon.svg?react';

type TCardType = 'myInterview' | 'community' | 'myPage';

interface ICardProps {
  type: TCardType;
  onClick: () => void;
}
export default function Card({ type, onClick }: ICardProps) {
  const titleMap = {
    myInterview: '나의 면접',
    community: '커뮤니티',
    myPage: '마이 페이지',
  };
  const svgMap = {
    myInterview: <MyIcon className="size-15" />,
    community: <CommunityIcon className="size-15" />,
    myPage: <MyPageIcon className="size-15" />,
  };
  const descriptionMap = {
    myInterview: '내가 진행한 모든 면접 기록을 한눈에 확인할 수 있어요 질문, 답변, 피드백까지 아카이브로 모아 관리하세요',
    community: '다른 사용자들과 경험과 인사이트를 공유할 수 있는 공간이에요 질문 아이디어나 면접 팁을 나누며 함께 성장하세요',
    myPage: '나의 프로필과 활동 내역을 관리할 수 있어요 설정부터 기록 관리까지, 개인화된 환경을 경험하세요',
  };

  return (
    <div
      onClick={onClick}
      className=" px-10 cursor-pointer gap-6 py-9 min-w-60 max-w-95 min-h-41 flex flex-col items-center rounded-[10px] bg-[#F8A16F]/5 border border-white/20 hover:shadow-[10px_20px_100px_0_rgba(248,161,111,0.4)] shadow-[10px_20px_100px_0_rgba(248,161,111,0.2)]"
    >
      <div>{svgMap[type]}</div>
      <p className="text-lg font-bold">{titleMap[type]}</p>
      <p className="text-sm font-normal leading-[23px] text-center text-black/80">{descriptionMap[type]}</p>
    </div>
  );
}
