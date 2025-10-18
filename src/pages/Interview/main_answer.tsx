import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import InterviewLayout from '@/layouts/InterviewLayout';

export default function AnswerQuestion() {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  const questions = [
    { id: 1, main: '메인질문', sub: '간단히 자기소개를 해주세요.' },
    { id: 2, main: '메인질문', sub: '이 직무를 선택한 이유는 무엇인가요?' },
    { id: 3, main: '메인질문', sub: '본인의 강점은 무엇이라고 생각하나요?' },
    { id: 4, main: '메인질문', sub: '입사 후 목표는 무엇인가요?' },
  ];

  const handleNext = () => {
    if (currentQuestion < 4) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // 마지막 질문이면 완료 모달 표시
      setShowCompleteModal(true);
    }
  };

  const handleQuestionClick = (questionNum: number) => {
    setCurrentQuestion(questionNum);
  };

  const handleFinalFeedback = () => {
    // 최종 피드백 페이지로 이동
    navigate('/feedback-result');
  };

  return (
    <InterviewLayout activeMenu="answer">
      {/* 중앙 컨텐츠 영역 */}
      <div className="flex-1 flex flex-col px-8 pt-2 max-w-[800px]">
        {/* 상단 정보 */}
        <div className="mb-4">
          <span className="inline-block bg-gray-400 text-white px-4 py-1 rounded-full text-sm">2025년_3월_자소서</span>
          <p className="text-gray-600 text-md mt-3">제한 시간 내에 면접질문에 답변해주세요.</p>
        </div>

        {/* 질문 탭 */}
        <div className="flex gap-2 mb-6">
          {questions.map((q) => (
            <button
              key={q.id}
              onClick={() => handleQuestionClick(q.id)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                currentQuestion === q.id
                  ? 'bg-white border-2 border-coral-500 text-coral-500'
                  : 'bg-white border border-gray-300 text-gray-500 hover:border-gray-400'
              }`}
            >
              질문{q.id}
            </button>
          ))}
        </div>

        {/* 질문 카드 */}
        <div className="bg-white rounded-2xl p-8 shadow-sm mb-6 flex-1">
          <h3 className="text-xl font-semibold text-gray-700 mb-6 text-center">
            {currentQuestion}. ({questions[currentQuestion - 1].main})
          </h3>
          <div className="border-t border-gray-200 pt-6"></div>

          <p className="text-gray-700 text-center mb-8">
            {currentQuestion}-1. {questions[currentQuestion - 1].sub}
          </p>

          {/* 캐릭터 이미지 */}
          <div className="flex justify-center mb-8">
            <img src="src/assets/clockFrog.svg" alt="면접관" className="w-48 h-auto" />
          </div>

          {/* 진행 바 + 오디오 플레이어 그룹 */}
          <div className="max-w-[600px] mx-auto">
            {/* 진행 바 */}
            <div className="mb-4">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-coral-500 transition-all duration-300" style={{ width: `${(currentQuestion / 4) * 100}%` }}></div>
              </div>
              <p className="text-center text-sm text-gray-500 mt-2">답변 가능 시간이 15초 남았습니다 ...</p>
            </div>

            {/* 오디오 플레이어 */}
            <div className="bg-gray-100 rounded-2xl p-6 mb-6">
              <div className="flex items-center gap-4">
                {/* 재생 버튼 */}
                <button className="w-12 h-12 bg-coral-500 hover:bg-coral-600 rounded-full flex items-center justify-center shadow-md transition-colors flex-shrink-0">
                  <svg className="w-5 h-5 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>

                {/* 프로그레스 바 */}
                <div className="flex-1">
                  <div className="h-2 bg-gray-300 rounded-full overflow-hidden">
                    <div className="h-full bg-coral-500 rounded-full" style={{ width: '30%' }}></div>
                  </div>
                </div>

                {/* 시간 표시 */}
                <span className="text-sm text-gray-600 font-medium flex-shrink-0">0:15</span>
              </div>
            </div>
          </div>

          {/* 다시 녹음하기 버튼 */}
          <div className="flex justify-center mb-6">
            <button className="bg-white border border-coral-500 text-coral-500 px-6 py-2 rounded-full text-sm font-medium hover:bg-coral-50 transition-colors">
              다시 녹음하기 (1회)
            </button>
          </div>
        </div>

        {/* 다음 버튼 */}
        <div className="flex justify-end pb-4">
          <button onClick={handleNext} className="bg-coral-400 hover:bg-coral-500 text-white px-8 py-3 rounded-lg font-medium transition-colors">
            다음
          </button>
        </div>
      </div>

      {/* 완료 모달 */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-12 max-w-md w-full mx-4 text-center">
            <div className="mb-6">
              <img src="src/assets/orangeFrog.svg" alt="완료" className="w-24 h-auto mx-auto" />
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-8">모든 질문에 완벽히 답했어요!</p>
            <button onClick={handleFinalFeedback} className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-3 rounded-lg font-medium transition-colors">
              최종 피드백 확인
            </button>
          </div>
        </div>
      )}

      <style>{`
        .bg-coral-50 {
          background-color: #fff5f5;
        }
        .bg-coral-400 {
          background-color: #ff9580;
        }
        .bg-coral-500 {
          background-color: #ff7f66;
        }
        .text-coral-500 {
          color: #ff7f66;
        }
        .border-coral-500 {
          border-color: #ff7f66;
        }
        .hover\\:bg-coral-500:hover {
          background-color: #ff7f66;
        }
        .hover\\:bg-coral-50:hover {
          background-color: #fff5f5;
        }
      `}</style>
    </InterviewLayout>
  );
}
