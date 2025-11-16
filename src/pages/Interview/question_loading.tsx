import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import InterviewLayout from '@/layouts/InterviewLayout';
import { createInterviewSession, extractResumeId } from '@/services/interviewApi';

export default function QuestionLoading() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const {
    resumeKey,
    jobTitle,
    interviewType,
  } = location.state || {};

  const [error, setError] = useState('');

  useEffect(() => {
    // 필수 데이터 체크
    if (!resumeKey || !jobTitle || !interviewType) {
      navigate('/upload', { replace: true });
      return;
    }

    const createSession = async () => {
      try {
        console.log('🎬 면접 세션 생성 시작');
        console.log('- Resume Key:', resumeKey);
        console.log('- Job Title:', jobTitle);
        console.log('- Interview Type:', interviewType);

        // S3 key에서 resumeId 추출
        const resumeId = extractResumeId(resumeKey);
        console.log('- Resume ID:', resumeId);

        // 면접 세션 생성
        const session = await createInterviewSession({
          mode: interviewType === 'pressure' ? 'HARD' : 'NORMAL',
          jobRole: jobTitle,
          resumeId: resumeId,
        });

        console.log('✅ 면접 세션 생성 성공:', session);

        // 면접 페이지로 이동 (약간의 딜레이 후)
        setTimeout(() => {
          navigate('/main-answer', {
            state: {
              sessionId: session.sessionId,
              firstQuestionId: session.firstQuestionId,
              firstQuestionText: session.firstQuestionText,
              resumeKey,
              jobTitle,
              interviewType,
            },
            replace: true,
          });
        }, 1000);
      } catch (err) {
        console.error('❌ 면접 세션 생성 실패:', err);
        setError('면접 세션 생성에 실패했습니다. 다시 시도해주세요.');
        
        // 에러 시 3초 후 업로드 페이지로 이동
        setTimeout(() => {
          navigate('/upload', { replace: true });
        }, 3000);
      }
    };

    createSession();
  }, [navigate, resumeKey, jobTitle, interviewType]);

  return (
    <InterviewLayout activeMenu="answer">
      {/* 중앙 컨텐츠 영역 */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {error ? (
          <div className="text-center">
            <p className="text-red-500 text-xl font-semibold mb-4">{error}</p>
            <p className="text-gray-600">업로드 페이지로 돌아갑니다...</p>
          </div>
        ) : (
          <>
            <p className="text-gray-900 text-2xl font-semibold mb-12">AI가 맞춤형 질문을 생성중입니다 ...</p>

            {/* 로딩 애니메이션 - 점 3개 */}
            <div className="flex gap-3">
              <div className="w-4 h-4 bg-coral-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-4 h-4 bg-coral-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-4 h-4 bg-coral-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </>
        )}
      </div>

      {/* 오른쪽 캐릭터 이미지 */}
      <div className="w-80 flex items-end justify-center">
        <img src="src/assets/frog.svg" alt="리뷰캐릭터" className="w-64 h-auto" />
      </div>

      <style>{`
        .bg-coral-500 {
          background-color: #ff7f66;
        }
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        .animate-bounce {
          animation: bounce 0.6s ease-in-out infinite;
        }
      `}</style>
    </InterviewLayout>
  );
}
