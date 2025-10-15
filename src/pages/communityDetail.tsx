import { useNavigate } from 'react-router-dom';

import WriteForm from '@/components/community/writeForm';

import { route } from '@/routes/route';

export default function CommunityDetail() {
  const navigate = useNavigate();
  const values = {
    company: '네카라쿠배',
    category: 'IT · 플랫폼',
    role: 'Frontend 개발',
    prep: '직무기술서 분석, 과제 리팩토링',
    strategy: 'STAR 구조로 답변, 수치화된 성과 강조',
    tips: '면접관 질문 의도 먼저 재확인',
  };
  return (
    <div className="w-full min-h-full px-20 py-15">
      <div className="flex flex-col gap-20 w-full min-h-full bg-[#EEEDF2] rounded-[20px] shadow-[0_7px_24px_0_#24262b25] p-10">
        <div className="flex flex-col">
          <div className="flex items-start justify-between">
            <p className="font-bold text-3xl">카카오/백엔드 개발자</p>
            <button className="h-14 w-45 bg-[#E95F45] rounded-lg text-white font-semibold text-sm" onClick={() => navigate(route.communityEdit)}>
              수정하기
            </button>
          </div>
          <p className="font-extralight text-sm">최근 수정 날짜: 2025년 8월 31일 14시</p>
        </div>
        <WriteForm readOnly values={values} />
      </div>
    </div>
  );
}
