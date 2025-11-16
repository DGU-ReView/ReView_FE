import React, { useEffect, useState } from 'react';

import useDeleteInterview from '@/hooks/useDeleteInterview';
import { getInterviewSummary, getRandomQuestions } from '@/apis/myPage';

import Delete from '@/assets/delete.svg?react';
import Frog from '@/assets/frog.svg?react';

type TCardProps = {
  id: number;
  title: string;
  createdAt?: string;
  onClick?: () => void;
};

export default function InterviewCard({ id, title, createdAt, onClick }: TCardProps) {
  const { mutate: deleteInterview } = useDeleteInterview();
  const [hasRandomQuestions, setHasRandomQuestions] = useState(false);

  // 랜덤 질문 여부 확인
  useEffect(() => {
    const checkRandomQuestions = async () => {
      try {
        // 1. 면접 상세 정보 조회
        const summary = await getInterviewSummary(id);
        
        if (summary.result.questionCards && summary.result.questionCards.length > 0) {
          // 2. 첫 번째 질문의 랜덤 질문 조회
          const firstQuestionId = summary.result.questionCards[0].questionId;
          const randomQuestionsData = await getRandomQuestions(firstQuestionId);
          
          // 3. 랜덤 질문이 있으면 true
          if (randomQuestionsData.result && randomQuestionsData.result.length > 0) {
            setHasRandomQuestions(true);
          }
        }
      } catch (error) {
        // 에러 발생 시 무시 (랜덤 질문 없음으로 처리)
        console.log('랜덤 질문 확인 중 오류:', error);
      }
    };

    void checkRandomQuestions();
  }, [id]);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteInterview({ sessionId: id });
  };

  // 날짜 포맷팅
  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
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
      className="relative cursor-pointer hover:bg-gray-50 pr-5 w-90 h-50 bg-white flex flex-col justify-center items-center rounded-[20px] border border-[#F1F1F1] shadow-[0_7px_14px_0_rgba(234,234,234,1)]"
    >
      {/* 삭제 버튼 */}
      <button type="button" className="absolute top-5 right-5" onClick={handleDeleteClick}>
        <Delete className="size-5" />
      </button>

      {/* 날짜, 랜덤 질문 뱃지 */}
      <div className="absolute top-5 left-5 flex flex-col gap-1">
        {formattedDate && <span className="text-xs text-gray-500">{formattedDate}</span>}
        {hasRandomQuestions && (
          <span className="bg-[#E95F45] text-white text-xs px-2 py-1 rounded-full font-medium w-fit">랜덤질문</span>
        )}
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex items-center justify-center gap-3">
        <Frog className="size-25" />
        <div className="flex flex-col gap-1">
          {/* 희망직군 (수정 불가) */}
          <p className="font-medium text-xl text-gray-900">{title}</p>
        </div>
      </div>
    </div>
  );
}
