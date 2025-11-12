import { useState } from 'react';
import InterviewLayout from '@/layouts/InterviewLayout';

interface QuestionState {
  id: number;
  showAnswer: boolean;
}

export default function FeedbackResult() {
  const [questionStates, setQuestionStates] = useState<QuestionState[]>([
    { id: 1, showAnswer: false },
    { id: 2, showAnswer: false },
    { id: 3, showAnswer: false },
    { id: 4, showAnswer: false },
  ]);

  const feedbacks = [
    {
      id: 1,
      title: '간단히 자기소개를 해주세요',
      type: '긍정적 피드백',
      feedback:
        '예상 질문은 잘 알겠지만 꼬리 질문에서 말이 막혀 아쉽습니다. 실제 면접이라고 생각하고 진행한 탓에 말이 빨라졌고, 직무 관련 경험을 구체적으로 설명했을 때는 면접관이 긍정적인 반응을 보였습니다. 다만 마지막 자기소개를 준비하지 못해 아쉬움이 남...예상 질문은 잘 알겠지만 꼬리 질문에서 말이 막혀 아쉽습니다. 실제 면접이라고 생각하고 진행한 탓에 말이 빨라졌고, 직무 관련 경험을 구체적으로 설명했을 때는 면접관이 긍정적인 반응을 보였습니다. 다만 마지막 자기소개를 준비하지 못해 아쉬움이 남...',
      answer:
        '내 답변 내용 내 답변 내용 내 답변 내용 내 답변 내용 내 답변 내용 내 답변 내용 내 답변 내용 내 답변 내용 내 답변 내용 내 답변 내용 내 답변 내용 내 답변 내용 내 답변 내용 내 답변 내용 내 답변 내용 내 답변 내용 내 답변 내용 내 답변 내용 내 답변 내용 내 답변 내용 내 답변 내용 내 답변 내용 내 답변 내용 내 답변 내용 내 답변 내용 내 답변 내용 내 답변 내용 내 답변 내용 내 답변 내용 내 답변 내용 내 답변 내용 내 답변 내용 내 답변 내용 내 답변 내용 내 답변 내용 내 답변 내용 내 답변 내용 내 답변 내용 내 답변 내용 내 답변 내용 내 답변 내용 내 답변 내용',
    },
    {
      id: 2,
      title: '간단히 자기소개를 해주세요',
      type: '긍정적 피드백',
      feedback:
        '예상 질문은 잘 알겠지만 꼬리 질문에서 말이 막혀 아쉽습니다. 실제 면접이라고 생각하고 진행한 탓에 말이 빨라졌고, 직무 관련 경험을 구체적으로 설명했을 때는 면접관이 긍정적인 반응을 보였습니다. 다만 마지막 자기소개를 준비하지 못해 아쉬움이 남...예상 질문은 잘 알겠지만 꼬리 질문에서 말이 막혀 아쉽습니다. 실제 면접이라고 생각하고 진행한 탓에 말이 빨라졌고, 직무 관련 경험을 구체적으로 설명했을 때는 면접관이 긍정적인 반응을 보였습니다. 다만 마지막 자기소개를 준비하지 못해 아쉬움이 남...',
      answer: '내 답변 내용입니다.',
    },
    {
      id: 3,
      title: '간단히 자기소개를 해주세요',
      type: '부정적 피드백',
      feedback:
        '예상 질문은 잘 알겠지만 꼬리 질문에서 말이 막혀 아쉽습니다. 실제 면접이라고 생각하고 진행한 탓에 말이 빨라졌고, 직무 관련 경험을 구체적으로 설명했을 때는 면접관이 긍정적인 반응을 보였습니다. 다만 마지막 자기소개를 준비하지 못해 아쉬움이 남...예상 질문은 잘 알겠지만 꼬리 질문에서 말이 막혀 아쉽습니다. 실제 면접이라고 생각하고 진행한 탓에 말이 빨라졌고, 직무 관련 경험을 구체적으로 설명했을 때는 면접관이 긍정적인 반응을 보였습니다. 다만 마지막 자기소개를 준비하지 못해 아쉬움이 남...',
      answer: '내 답변 내용입니다.',
    },
    {
      id: 4,
      title: '간단히 자기소개를 해주세요',
      type: '부정적 피드백',
      feedback:
        '예상 질문은 잘 알겠지만 꼬리 질문에서 말이 막혀 아쉽습니다. 실제 면접이라고 생각하고 진행한 탓에 말이 빨라졌고, 직무 관련 경험을 구체적으로 설명했을 때는 면접관이 긍정적인 반응을 보였습니다. 다만 마지막 자기소개를 준비하지 못해 아쉬움이 남...',
      answer: '내 답변 내용입니다.',
    },
  ];

  const toggleAnswer = (id: number) => {
    setQuestionStates((prev) => prev.map((q) => (q.id === id ? { ...q, showAnswer: !q.showAnswer } : q)));
  };

  return (
    <InterviewLayout activeMenu="feedback">
      {/* 중앙 컨텐츠 영역 */}
      <div className="flex-1 px-8 pt-4">
        {/* 상단 정보 */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">
            <span className="inline-block bg-gray-400 text-white px-4 py-1 rounded-full text-sm mr-2">2025년_3월_자소서</span>에 대한 최종 피드백
          </h2>
          <p className="text-gray-600">
            시간 초과로 답변하지 못한 질문 <span className="inline-block bg-coral-500 text-white px-3 py-1 rounded-md text-sm font-medium">n개</span>
          </p>
        </div>

        {/* 질문 카드 그리드 */}
        <div className="grid grid-cols-2 gap-6 pb-8">
          {feedbacks.map((item) => {
            const isShowingAnswer = questionStates.find((q) => q.id === item.id)?.showAnswer;

            return (
              <div key={item.id} className={`rounded-2xl p-6 shadow-sm transition-colors ${isShowingAnswer ? 'bg-gray-200' : 'bg-white'}`}>
                {/* 카드 헤더 */}
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {item.id}. {item.title}
                  </h3>
                  <p className="text-sm text-gray-500">AI 피드백 | {item.type}</p>
                </div>

                {/* 카드 내용 (스크롤 가능) */}
                <div className="mb-4 max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  <p className="text-sm text-gray-700 leading-relaxed">{isShowingAnswer ? item.answer : item.feedback}</p>
                </div>

                {/* 버튼 */}
                <div className="flex justify-end">
                  <button
                    onClick={() => toggleAnswer(item.id)}
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
