import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload } from 'lucide-react';

import InterviewLayout from '@/layouts/InterviewLayout';

export default function MyInterview() {
  const navigate = useNavigate();
  const [fileName, setFileName] = useState('파일 업로드');
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string>('');

  // 파일 유효성 검사
  const validateFile = (validFile: File): boolean => {
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    const fileExtension = validFile.name.substring(validFile.name.lastIndexOf('.')).toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
      setError('허용된 파일 형식: PDF, DOC, DOCX, TXT');
      return false;
    }

    if (validFile.size > maxSize) {
      setError('파일 크기는 10MB 이하여야 합니다.');
      return false;
    }

    setError('');
    return true;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
        setFileName(droppedFile.name);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
        setFileName(selectedFile.name);
      }
    }
  };

  const handleBoxClick = () => {
    document.getElementById('file-upload')?.click();
  };

  const handleSubmit = () => {
    if (!file) {
      setError('파일을 선택해주세요.');
      return;
    }
    // 파일 객체를 다음 페이지로 전달
    navigate('/upload-done', { state: { file } });
  };

  return (
    <InterviewLayout activeMenu="upload">
      {/* 중앙 컨텐츠 영역 */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <p className="text-gray-700 text-lg mb-8">자소서를 업로드해주세요.</p>

        {/* 에러 메시지 */}
        {error && (
          <div className="w-full max-w-md mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* 파일 업로드 영역 */}
        <div className="w-full max-w-md space-y-4">
          <div
            onClick={handleBoxClick}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
              dragActive ? 'border-coral-400 bg-coral-50' : 'border-coral-300 bg-white'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="flex items-center justify-between">
              <span className={`${file ? 'text-coral-600 font-medium' : 'text-coral-500'}`}>{fileName}</span>
              <Upload className="w-5 h-5 text-coral-500" />
              <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.doc,.docx,.txt" />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!file}
            className={`w-full font-medium py-4 rounded-2xl transition-colors ${
              file ? 'bg-coral-400 hover:bg-coral-500 text-white cursor-pointer' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            제출하기
          </button>
        </div>
      </div>

      {/* 오른쪽 캐릭터 이미지 */}
      <div className="w-80 flex items-end justify-center">
        <img src="src/assets/orangeFrog.svg" alt="리뷰캐릭터" className="w-64 h-auto" />
      </div>

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
        .bg-coral-600 {
          background-color: #ff6b52;
        }
        .text-coral-500 {
          color: #ff7f66;
        }
        .text-coral-600 {
          color: #ff6b52;
        }
        .border-coral-300 {
          border-color: #ffb3a3;
        }
        .border-coral-400 {
          border-color: #ff9580;
        }
        .hover\\:bg-coral-500:hover {
          background-color: #ff7f66;
        }
      `}</style>
    </InterviewLayout>
  );
}
