import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import InterviewLayout from '@/layouts/InterviewLayout';
import { getFinalFeedback, FinalFeedbackResponse } from '@/services/interviewApi';

interface IQuestionState {
  id: number;
  showAnswer: boolean;
}

export default function FeedbackResult() {
  const navigate = useNavigate();
  const location = useLocation();
  const { sessionId } = location.state || {};

  const [feedbackData, setFeedbackData] = useState<FinalFeedbackResponse | null>(null);
  const [questionStates, setQuestionStates] = useState<IQuestionState[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 피드백 조회
  useEffect(() => {
    if (!sessionId) {
      alert('세션 정보가 없습니다.');
      navigate('/upload');
      return;
    }

    const fetchFeedback = async () => {
      try {
        setIsLoading(true);
        console.log('📊 최종 피드백 조회 시작:', sessionId);

        const response = await getFinalFeedback(sessionId);

        // feedbackProgressStatus 확인
        if (response.feedbackProgressStatus === 'WORKING') {
          // 피드백 생성 중 - 재시도 또는 메시지 표시
          setTimeout(fetchFeedback, 5000); // 5초 후 재시도
          return;
        }

        if (response.feedbackProgressStatus === 'FAILED') {
          setError('피드백 생성에 실패했습니다.');
          return;
        }

        if (response.interviewSummary) {
          setFeedbackData(response);

          // 질문 상태 초기화
          const states = response.interviewSummary.questionSummaries.map((_, index) => ({
            id: index + 1,
            showAnswer: false,
          }));
          setQuestionStates(states);
        }
      } catch (err) {
        console.error('❌ 피드백 조회 실패:', err);
        setError('피드백을 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeedback();
  }, [sessionId, navigate]);

  const toggleAnswer = (id: number) => {
    setQuestionStates((prev) =>
      prev.map((q) => (q.id === id ? { ...q, showAnswer: !q.showAnswer } : q))
    );
  };

  // 로딩 중
  if (isLoading) {
    return (
      <InterviewLayout activeMenu="feedback">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="mb-4">
              <img
                src="src/assets/clockFrog.svg"
                alt="로딩"
                className="w-32 h-auto mx-auto animate-pulse"
              />
            </div>
            <p className="text-gray-600 text-lg">
              피드백을 생성하고 있습니다...
            </p>
            <p className="text-gray-500 text-sm mt-2">
              최대 5분 정도 소요될 수 있습니다.
            </p>
          </div>
        </div>
      </InterviewLayout>
    );
  }

  // 에러
  if (error || !feedbackData || !feedbackData.interviewSummary) {
    return (
      <InterviewLayout activeMenu="feedback">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 text-lg mb-4">
              {error || '피드백 데이터를 불러올 수 없습니다.'}
            </p>
            <button
              onClick={() => navigate('/upload')}
              className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              처음으로 돌아가기
            </button>
          </div>
        </div>
      </InterviewLayout>
    );
  }

  const { interviewSummary } = feedbackData;

  return (
    <InterviewLayout activeMenu="feedback">
      {/* 중앙 컨텐츠 영역 */}
      <div className="flex-1 px-8 pt-4">
        {/* 상단 정보 */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">
            <span className="inline-block bg-gray-400 text-white px-4 py-1 rounded-full text-sm mr-2">
              {interviewSummary.interviewTitle}
            </span>
            에 대한 최종 피드백
          </h2>
          {interviewSummary.timeoutQuestionNumber > 0 && (
            <p className="text-gray-600">
              시간 초과로 답변하지 못한 질문{' '}
              <span className="inline-block bg-coral-500 text-white px-3 py-1 rounded-md text-sm font-medium">
                {interviewSummary.timeoutQuestionNumber}개
              </span>
            </p>
          )}
        </div>

        {/* 질문 카드 그리드 */}
        <div className="grid grid-cols-2 gap-6 pb-8">
          {interviewSummary.questionSummaries.map((summary, index) => {
            const isShowingAnswer =
              questionStates.find((q) => q.id === index + 1)?.showAnswer || false;

            // AI 피드백과 셀프 피드백 중 표시할 것 선택
            const feedbackText = summary.aiFeedback || summary.selfFeedback;
            const feedbackType = summary.aiFeedback
              ? 'AI 피드백'
              : summary.selfFeedback
              ? '셀프 피드백'
              : '피드백 없음';

            // 답변 텍스트 (Q&A 턴에서 ANSWER만 추출)
            const answerText = summary.qnaTurns
              .filter((turn) => turn.turn === 'ANSWER')
              .map((turn) => turn.content)
              .join('\n\n');

            // 타임아웃으로 답변 못한 질문인지 확인
            const hasAnswer = answerText.length > 0;

            return (
              <div
                key={index}
                className={`rounded-2xl p-6 shadow-sm transition-colors ${
                  isShowingAnswer ? 'bg-gray-200' : 'bg-white'
                }`}
              >
                {/* 카드 헤더 */}
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {summary.questionNumber}. {summary.rootQuestion}
                  </h3>
                  <p className="text-sm text-gray-500">{feedbackType}</p>
                </div>

                {/* 카드 내용 (스크롤 가능) */}
                <div className="mb-4 max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {isShowingAnswer ? (
                    hasAnswer ? (
                      <div className="space-y-3">
                        {summary.qnaTurns.map((turn, turnIndex) => (
                          <div key={turnIndex}>
                            <p className="text-xs font-semibold text-gray-600 mb-1">
                              {turn.turn === 'QUESTION' ? '질문:' : '답변:'}
                            </p>
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {turn.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">
                        시간 초과로 답변하지 못했습니다.
                      </p>
                    )
                  ) : feedbackText ? (
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {feedbackText}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      피드백이 생성되지 않았습니다.
                    </p>
                  )}
                </div>

                {/* 버튼 */}
                <div className="flex justify-end">
                  <button
                    onClick={() => toggleAnswer(index + 1)}
                    className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isShowingAnswer
                        ? 'bg-coral-500 text-white hover:bg-coral-600'
                        : 'bg-gray-500 text-white hover:bg-gray-600'
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
        .bg-coral-500 {
          background-color: #ff7f66;
        }
        .bg-coral-600 {
          background-color: #ff6b52;
        }
        .hover\\:bg-coral-600:hover {
          background-color: #ff6b52;
        }
        
        /* 스크롤바 스타일링 */
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thumb-gray-300::-webkit-scrollbar-thumb {
          background-color: #d1d5db;
          border-radius: 3px;
        }
        .scrollbar-track-gray-100::-webkit-scrollbar-track {
          background-color: #f3f4f6;
          border-radius: 3px;
        }
      `}</style>
    </InterviewLayout>
  );
}
