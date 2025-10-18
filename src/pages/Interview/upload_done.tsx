import { useNavigate } from 'react-router-dom';
import InterviewLayout from '@/layouts/InterviewLayout';

export default function UploadDone() {
  const navigate = useNavigate();

  const handleConfirm = () => {
    navigate('/upload-check');
  };

  return (
    <InterviewLayout activeMenu="upload">
      {/* 중앙 컨텐츠 영역 */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="bg-white rounded-3xl shadow-lg p-12 w-full max-w-lg">
          <p className="text-center text-xl font-medium text-gray-900 mb-8">
            업로드가 성공적으로 완료되었어요.
          </p>
          <button 
            onClick={handleConfirm}
            className="w-full bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-8 rounded-lg transition-colors"
          >
            확인
          </button>
        </div>
      </div>

      {/* 오른쪽 캐릭터 이미지 */}
      <div className="w-80 flex items-end justify-center">
        <img src="src/assets/orangeFrog.svg" alt="리뷰캐릭터" className="w-64 h-auto" />
      </div>
    </InterviewLayout>
  );
}