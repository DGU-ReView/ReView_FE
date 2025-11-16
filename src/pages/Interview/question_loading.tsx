import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import InterviewLayout from '@/layouts/InterviewLayout';
import type { ICreateInterviewSessionResponse } from '@/services/interviewApi';
import { createInterviewSession } from '@/services/interviewApi';

const ANSWER_ROUTE = '/main-answer'; // 프로젝트 라우트에 맞게 조정

type TLocationState = {
  fileName?: string;
  jobTitle?: string;
  interviewType?: 'normal' | 'pressure';
  resumeKey?: string; // S3 key
};

export default function QuestionLoading() {
  const navigate = useNavigate();
  const location = useLocation() as { state?: TLocationState };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const fileName = location.state?.fileName ?? '자소서';
        const jobTitle = location.state?.jobTitle;
        const interviewType = location.state?.interviewType ?? 'normal';
        const resumeKey = location.state?.resumeKey;

        if (!jobTitle || !resumeKey) {
          alert('면접 생성에 필요한 정보가 없습니다. (jobTitle/resumeKey)');
          navigate(-1);
          return;
        }

        // 스펙에 맞게 요청
        const resp: ICreateInterviewSessionResponse = await createInterviewSession({
          resumeKey,
          jobTitle,
          interviewType,
        });

        // 성공 → 답변 페이지로 이동 (필요값 전달)
        navigate(ANSWER_ROUTE, {
          replace: true,
          state: {
            fileName,
            jobTitle,
            interviewType,
            resumeKey,
            sessionId: resp.sessionId,
            firstQuestion: resp.firstQuestion,
            fromLoading: true,
          },
        });
      } catch (e) {
        console.error('질문 생성 실패:', e);
        alert('맞춤형 질문 생성에 실패했습니다. 잠시 후 다시 시도해주세요.');
        navigate(-1);
      }
    };

    void bootstrap();
  }, [location.state, navigate]);

  return (
    <InterviewLayout activeMenu="answer">
      {/* 중앙 컨텐츠 영역 */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <p className="text-gray-900 text-2xl font-semibold mb-12">AI가 맞춤형 질문을 생성중입니다 ...</p>

        {/* 로딩 애니메이션 - 점 3개 */}
        <div className="flex gap-3">
          <div className="w-4 h-4 bg-coral-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-4 h-4 bg-coral-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-4 h-4 bg-coral-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>

      {/* 오른쪽 캐릭터 이미지 */}
      <div className="w-80 flex items-end justify-center">
        <img src="src/assets/frog.svg" alt="리뷰캐릭터" className="w-64 h-auto" />
      </div>

      <style>{`
        .bg-coral-500 { background-color: #ff7f66; }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
        .animate-bounce { animation: bounce 0.6s ease-in-out infinite; }
      `}</style>
    </InterviewLayout>
  );
}
