import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import InterviewLayout from '@/layouts/InterviewLayout';

export default function QuestionLoading() {
  const navigate = useNavigate();

  useEffect(() => {
    // 3초 후 자동으로 다음 페이지로 이동
    const timer = setTimeout(() => {
      navigate('/question-done');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

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
