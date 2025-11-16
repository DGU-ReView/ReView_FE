import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import InterviewLayout from '@/layouts/InterviewLayout';

export default function UploadCheck() {
  const navigate = useNavigate();
  const location = useLocation();
  const file = location.state?.file as File | undefined;

  const [interviewType, setInterviewType] = useState<'normal' | 'pressure'>('normal');
  const [showJobCard, setShowJobCard] = useState(false);
  const [jobTitle, setJobTitle] = useState('');

  // 파일이 없으면 업로드 페이지로 리다이렉트
  useEffect(() => {
    if (!file) {
      navigate('/upload', { replace: true });
    }
  }, [file, navigate]);

  const handleJobSelect = () => {
    setShowJobCard(true);
  };

  const handleJobTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value.length <= 15) {
      setJobTitle(e.target.value);
    }
  };

  const handleStartInterview = () => {
    navigate('/question-loading', {
      state: {
        file,
        jobTitle,
        interviewType,
        fileName: file?.name || '',
      },
    });
  };

  if (!file) return null;

  return (
    <InterviewLayout activeMenu="upload">
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-lg mb-2">
          <p className="text-gray-700 text-2xl font-medium text-left mb-4">자소서 확인</p>

          <div className="flex items-center justify-end gap-4 mb-2">
            <span className={`text-lg ${interviewType === 'normal' ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>일반면접</span>
            <button
              onClick={() => setInterviewType(interviewType === 'normal' ? 'pressure' : 'normal')}
              className={`relative w-14 h-7 rounded-full transition-colors ${interviewType === 'pressure' ? 'bg-gray-800' : 'bg-gray-300'}`}
            >
              <div
                className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                  interviewType === 'pressure' ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-lg ${interviewType === 'pressure' ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>압박면접</span>
          </div>
        </div>

        <div className="w-full max-w-lg mb-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <div className="flex flex-col">
                <span className="text-gray-700">{file.name}</span>
                <span className="text-xs text-gray-400">{(file.size / 1024).toFixed(2)} KB</span>
              </div>
            </div>
            <button onClick={handleJobSelect} className="bg-sky-400 hover:bg-sky-500 text-white px-6 py-2 rounded-lg transition-colors">
              직무선택
            </button>
          </div>
        </div>

        {showJobCard && (
          <>
            <p className="text-gray-600 text-md mb-4">지원 예정인 분야를 입력해주세요.</p>

            <div className="w-full max-w-lg mb-6">
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">희망직군</h3>
                    <span className="text-xs text-gray-400">{jobTitle.length}/15</span>
                  </div>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={handleJobTitleChange}
                    placeholder="희망직군을 입력하세요 (예: 프론트엔드 개발자)"
                    maxLength={15}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleStartInterview}
              disabled={!jobTitle.trim()}
              className={`px-8 py-3 rounded-lg font-medium transition-colors ${
                jobTitle.trim() ? 'bg-coral-400 hover:bg-coral-500 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              질문생성 &gt;&gt;
            </button>
          </>
        )}
      </div>

      <div className="w-80 flex items-end justify-center">
        <img src="src/assets/orangeFrog.svg" alt="리뷰캐릭터" className="w-64 h-auto" />
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
