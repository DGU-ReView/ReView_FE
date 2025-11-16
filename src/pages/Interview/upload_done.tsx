import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import InterviewLayout from '@/layouts/InterviewLayout';
import orangeFrog from '@/assets/orangeFrog.svg';

export default function UploadDone() {
  const navigate = useNavigate();
  const location = useLocation();
  const file = location.state?.file as File | undefined;
  const resumeKey = location.state?.resumeKey as string | undefined; // resumeKey 추가

  // 파일이나 resumeKey가 없으면 업로드 페이지로 리다이렉트
  useEffect(() => {
    if (!file || !resumeKey) {
      navigate('/upload', { replace: true });
    }
  }, [file, resumeKey, navigate]);

  const handleConfirm = () => {
    // 파일 정보와 resumeKey를 upload-check 페이지로 전달
    navigate('/upload-check', {
      state: {
        file,
        resumeKey, // resumeKey 전달
      },
    });
  };

  if (!file || !resumeKey) return null;

  return (
    <InterviewLayout activeMenu="upload">
      {/* 중앙 컨텐츠 영역 */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="bg-white rounded-3xl shadow-lg p-12 w-full max-w-lg">
          <p className="text-center text-xl font-medium text-gray-900 mb-4">업로드가 성공적으로 완료되었어요.</p>
          <div className="text-center text-sm text-gray-600 mb-8">
            <p className="font-medium">{file.name}</p>
            <p className="text-xs text-gray-400 mt-1">{(file.size / 1024).toFixed(2)} KB</p>
          </div>
          <button onClick={handleConfirm} className="w-full bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-8 rounded-lg transition-colors">
            확인
          </button>
        </div>
      </div>

      {/* 오른쪽 캐릭터 이미지 */}
      <div className="w-80 flex items-end justify-center">
        <img src={orangeFrog} alt="리뷰캐릭터" className="w-48 h-auto" />
      </div>
    </InterviewLayout>
  );
}
