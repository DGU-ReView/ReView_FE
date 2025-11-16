import { useNavigate } from 'react-router-dom';

import InterviewLayout from '@/layouts/InterviewLayout';
import Frog from '@/assets/frog.svg';

export default function QuestionDone() {
  const navigate = useNavigate();

  const handleViewQuestions = () => {
    // 질문 페이지로 이동
    navigate('/main-answer');
  };

  return (
    <InterviewLayout activeMenu="answer">
      {/* 중앙 컨텐츠 영역 */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <p className="text-gray-900 text-2xl font-semibold mb-12">맞춤형 질문이 생성되었습니다.</p>

        <button onClick={handleViewQuestions} className="bg-coral-400 hover:bg-coral-500 text-white font-medium px-8 py-3 rounded-lg transition-colors">
          면접보기 &gt;&gt;
        </button>
      </div>

      {/* 오른쪽 캐릭터 이미지 */}
      <div className="w-80 flex items-end justify-center">
        <img src={Frog} alt="리뷰캐릭터" className="w-48 h-auto" />
      </div>

      <style>{`
        .bg-coral-400 {
          background-color: #ff9580;
        }
        .bg-coral-500 {
          background-color: #ff7f66;
        }
        .hover\\:bg-coral-500:hover {
          background-color: #ff7f66;
        }
      `}</style>
    </InterviewLayout>
  );
}
