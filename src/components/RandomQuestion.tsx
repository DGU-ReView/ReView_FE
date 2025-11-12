import { useEffect, useState } from 'react';

export default function RandomQuestionPopup() {
  const [showPopup, setShowPopup] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const questions = [
    { id: 1, main: '메인질문', sub: '간단히 자기소개를 해주세요.' },
    { id: 2, main: '메인질문', sub: '이 직무를 선택한 이유는 무엇인가요?' },
    { id: 3, main: '메인질문', sub: '본인의 강점은 무엇이라고 생각하나요?' },
    { id: 4, main: '메인질문', sub: '입사 후 목표는 무엇인가요?' },
  ];

  useEffect(() => {
    const timeout = setTimeout(
      () => {
        const randomIndex = Math.floor(Math.random() * questions.length);
        setCurrentQuestion(randomIndex);
        setShowPopup(true);
      },
      Math.random() * 5000 + 3000,
    ); // 3~8초 사이 랜덤 시간 후 등장

    return () => clearTimeout(timeout);
  }, []);

  if (!showPopup) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 shadow-lg w-full max-w-md mx-4 relative">
        {/* 닫기 버튼 */}
        <button onClick={() => setShowPopup(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* 질문 카드 */}
        <h3 className="text-xl font-semibold text-gray-700 mb-6 text-center">
          {questions[currentQuestion].id}. ({questions[currentQuestion].main})
        </h3>
        <p className="text-gray-700 text-center mb-8">
          {questions[currentQuestion].id}-1. {questions[currentQuestion].sub}
        </p>

        {/* 이미지 */}
        <div className="flex justify-center mb-8">
          <img src="/src/assets/clockFrog.svg" alt="면접관" className="w-32 h-auto" />
        </div>

        {/* 진행바 */}
        <div className="mb-4">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-coral-500 transition-all duration-300" style={{ width: `${((currentQuestion + 1) / 4) * 100}%` }}></div>
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

        {/* 다시 녹음하기 */}
        <div className="flex justify-center mb-4">
          <button className="bg-white border border-coral-500 text-coral-500 px-6 py-2 rounded-full text-sm font-medium hover:bg-coral-50 transition-colors">
            다시 녹음하기 (1회)
          </button>
        </div>

        {/* 다음 버튼 (오른쪽 아래 고정, 직사각형 스타일로 변경) */}
        <div className="absolute bottom-6 right-6">
          <button className="bg-coral-500 hover:bg-coral-600 text-white text-sm font-medium px-6 py-3 rounded-xl shadow-md transition-colors">다음</button>
        </div>
      </div>

      <style>{`
        .bg-coral-50 { background-color: #fff5f5; }
        .bg-coral-500 { background-color: #ff7f66; }
        .text-coral-500 { color: #ff7f66; }
        .border-coral-500 { border-color: #ff7f66; }
      `}</style>
    </div>
  );
}
