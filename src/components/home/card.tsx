import MyIcon from '@/assets/myIcon.svg?react';
import MyPageIcon from '@/assets/myPageIcon.svg?react';
import CommunityIcon from '@/assets/communityIcon.svg?react';

type CardType = 'myInterview' | 'community' | 'myPage';

interface CardProps {
  type: CardType;
}
export default function Card({ type }: CardProps) {
  const titleMap = {
    myInterview: '나의 면접',
    community: '커뮤니티',
    myPage: '마이 페이지',
  };
  const svgMap = {
    myInterview: <MyIcon />,
    community: <CommunityIcon />,
    myPage: <MyPageIcon />,
  };
  const descriptionMap = {
    myInterview: '내가 진행한 모든 면접 기록을 한눈에 확인할 수 있어요 질문, 답변, 피드백까지 아카이브로 모아 관리하세요',
    community: '다른 사용자들과 경험과 인사이트를 공유할 수 있는 공간이에요 질문 아이디어나 면접 팁을 나누며 함께 성장하세요',
    myPage: '나의 프로필과 활동 내역을 관리할 수 있어요 설정부터 기록 관리까지, 개인화된 환경을 경험하세요',
  };

  return (
    <div className="px-21 gap-6 pt-9 w-90 h-81 flex flex-col items-center rounded-[10px] bg-[#F8A16F]/5 border border-white/20 shadow-[10px_20px_100px_0_rgba(248,161,111,0.2)]">
      <div>{svgMap[type]}</div>
      <p className="text-lg font-bold">{titleMap[type]}</p>
      <p className="text-base font-normal leading-[23px] text-center">{descriptionMap[type]}</p>
    </div>
  );
}
