// src/pages/Interview/feedback_result.tsx
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import InterviewLayout from '@/layouts/InterviewLayout';
import type { IFeedbackItem, IFinalFeedbackResponse } from '@/services/interviewApi';
import { getFinalFeedback } from '@/services/interviewApi';

interface IQuestionState {
  id: number;
  showAnswer: boolean;
}

export default function FeedbackResult() {
  const navigate = useNavigate();
  const location = useLocation() as { state?: { sessionId?: string } };
  const { sessionId } = location.state || {};

  const [feedbackData, setFeedbackData] = useState<IFinalFeedbackResponse | null>(null);
  const [questionStates, setQuestionStates] = useState<IQuestionState[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      alert('세션 정보가 없습니다.');
      navigate('/upload');
      return;
    }
    const fetchFeedback = async () => {
      try {
        setIsLoading(true);
        const response = await getFinalFeedback(sessionId);
        setFeedbackData(response);
        const states = response.feedbacks.map((_, idx) => ({ id: idx + 1, showAnswer: false }));
        setQuestionStates(states);
      } catch (err) {
        console.error('❌ 피드백 조회 실패:', err);
        setError('피드백을 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };
    void fetchFeedback();
  }, [navigate, sessionId]);

  const toggleAnswer = (id: number) => {
    setQuestionStates((prev) => prev.map((q) => (q.id === id ? { ...q, showAnswer: !q.showAnswer } : q)));
  };

  if (isLoading) {
    return (
      <InterviewLayout activeMenu="feedback">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="mb-4">
              <img src="src/assets/clockFrog.svg" alt="로딩" className="w-32 h-auto mx-auto animate-pulse" />
            </div>
            <p className="text-gray-600 text-lg">피드백을 생성하고 있습니다...</p>
            <p className="text-gray-500 text-sm mt-2">최대 5분 정도 소요될 수 있습니다.</p>
          </div>
        </div>
      </InterviewLayout>
    );
  }

  if (error || !feedbackData) {
    return (
      <InterviewLayout activeMenu="feedback">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 text-lg mb-4">{error || '피드백 데이터를 불러올 수 없습니다.'}</p>
            <button onClick={() => navigate('/upload')} className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-medium transition-colors">
              처음으로 돌아가기
            </button>
          </div>
        </div>
      </InterviewLayout>
    );
  }

  const { feedbacks, totalQuestions, timeoutCount } = feedbackData;

  return (
    <InterviewLayout activeMenu="feedback">
      <div className="flex-1 px-8 pt-4">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">
            <span className="inline-block bg-gray-400 text-white px-4 py-1 rounded-full text-sm mr-2">총 {totalQuestions}문항</span>에 대한 최종 피드백
          </h2>
          {timeoutCount > 0 && (
            <p className="text-gray-600">
              시간 초과로 답변하지 못한 질문{' '}
              <span className="inline-block bg-coral-500 text-white px-3 py-1 rounded-md text-sm font-medium">{timeoutCount}개</span>
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-6 pb-8">
          {feedbacks.map((item: IFeedbackItem, index: number) => {
            const isShowingAnswer = questionStates.find((q) => q.id === index + 1)?.showAnswer || false;
            const isPositive = item.feedbackType === 'positive';
            const feedbackTypeLabel = isPositive ? 'AI 피드백(긍정)' : 'AI 피드백(개선)';
            const hasAnswer = !!item.answer && item.answer.trim().length > 0;

            return (
              <div
                key={`${item.questionId}-${index}`}
                className={`rounded-2xl p-6 shadow-sm transition-colors ${isShowingAnswer ? 'bg-gray-200' : 'bg-white'}`}
              >
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {index + 1}. {item.question}
                  </h3>
                  <p className="text-sm text-gray-500">{feedbackTypeLabel}</p>
                </div>

                <div className="mb-4 max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {isShowingAnswer ? (
                    hasAnswer ? (
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-semibold text-gray-600 mb-1">답변:</p>
                          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{item.answer}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">{item.timeout ? '시간 초과로 답변하지 못했습니다.' : '답변이 제공되지 않았습니다.'}</p>
                    )
                  ) : item.feedback ? (
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{item.feedback}</p>
                  ) : (
                    <p className="text-sm text-gray-500 italic">피드백이 생성되지 않았습니다.</p>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => toggleAnswer(index + 1)}
                    className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isShowingAnswer ? 'bg-coral-500 text-white hover:bg-coral-600' : 'bg-gray-500 text-white hover:bg-gray-600'
                    }`}
                  >
                    {isShowingAnswer ? '확인' : '내 답변 보기'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        .bg-coral-500 { background-color: #ff7f66; }
        .bg-coral-600 { background-color: #ff6b52; }
        .hover\\:bg-coral-600:hover { background-color: #ff6b52; }
        .scrollbar-thin::-webkit-scrollbar { width: 6px; }
        .scrollbar-thumb-gray-300::-webkit-scrollbar-thumb { background-color: #d1d5db; border-radius: 3px; }
        .scrollbar-track-gray-100::-webkit-scrollbar-track { background-color: #f3f4f6; border-radius: 3px; }
      `}</style>
    </InterviewLayout>
  );
}
