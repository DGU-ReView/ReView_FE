import React from 'react';

import OrangeFrog from '@/assets/orangeFrog.svg?react';

type TRandomQuestionCardProps = {
  questionText: string;
  createdAt: string;
  jobRole?: string;
  onClick?: () => void;
};

export default function RandomQuestionCard({ questionText, createdAt, jobRole, onClick }: TRandomQuestionCardProps) {
  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}년 ${month}월 ${day}일`;
  };

  const formattedDate = formatDate(createdAt);

  return (
    <div
      onClick={onClick}
      className="relative cursor-pointer hover:bg-orange-50 pr-5 w-90 h-50 bg-gradient-to-br from-orange-50 to-white flex flex-col justify-center items-center rounded-[20px] border-2 border-[#FF9A76] shadow-[0_7px_14px_0_rgba(255,154,118,0.3)]"
    >
      {/* 랜덤 질문 뱃지 */}
      <div className="absolute top-5 left-5">
        <span className="bg-[#E95F45] text-white text-xs px-3 py-1 rounded-full font-bold">랜덤질문</span>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex flex-col items-center justify-center gap-2 mt-2">
        <OrangeFrog className="size-20" />
        <div className="text-center px-4">
          <p className="font-bold text-lg text-gray-900 mb-1">{formattedDate}</p>
          {jobRole && <p className="text-sm text-gray-600 mb-2">{jobRole}</p>}
          <p className="text-xs text-gray-500 line-clamp-2">{questionText}</p>
        </div>
      </div>
    </div>
  );
}
