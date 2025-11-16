<<<<<<< HEAD
import React, { useState } from 'react';
=======
import { useState } from 'react';
import type { DragEvent, ChangeEvent } from 'react';
import { Upload } from 'lucide-react';
>>>>>>> 1a99a49 (자소서 업로드)
import { useNavigate } from 'react-router-dom';
import { Upload } from 'lucide-react';

import InterviewLayout from '@/layouts/InterviewLayout';
import { uploadResume } from '@/services/interviewApi';

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function MyInterview() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('파일 업로드');
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

<<<<<<< HEAD
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
=======
  const validateFile = (targetFile: File): boolean => {
    setError('');

    const extension = '.' + (targetFile.name.split('.').pop() ?? '').toLowerCase();

    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      setError('PDF, DOC, DOCX, TXT 파일만 업로드 가능합니다.');
      return false;
    }

    if (targetFile.size > MAX_FILE_SIZE) {
      setError('파일 크기는 10MB를 초과할 수 없습니다.');
>>>>>>> 1a99a49 (자소서 업로드)
      return false;
    }

    return true;
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
<<<<<<< HEAD
=======

>>>>>>> 1a99a49 (자소서 업로드)
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0];

      if (validateFile(selectedFile)) {
        setFile(selectedFile);
        setFileName(selectedFile.name);
      }
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
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

  const handleSubmit = async () => {
    if (!file) {
      setError('파일을 선택해주세요.');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      console.log('📁 자소서 업로드 시작:', file.name);

      // API 호출: 자소서 업로드
      const fileKey = await uploadResume(file);

      console.log('✅ 자소서 업로드 성공! fileKey:', fileKey);

      // 업로드 성공 후 다음 페이지로 이동
      navigate('/upload-done', {
        state: {
          file,
          fileName,
          resumeKey: fileKey, // S3 파일 키 전달
        },
      });
    } catch (err) {
      console.error('❌ 자소서 업로드 실패:', err);
      setError('파일 업로드에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <InterviewLayout activeMenu="upload">
      <div className="flex-1 flex flex-col items-center justify-center">
        <p className="text-gray-700 text-lg mb-8">자소서를 업로드해주세요.</p>

<<<<<<< HEAD
        {/* 에러 메시지 */}
=======
>>>>>>> 1a99a49 (자소서 업로드)
        {error && (
          <div className="w-full max-w-md mb-4">
            <p className="text-red-500 text-sm text-center">{error}</p>
          </div>
        )}

<<<<<<< HEAD
        {/* 파일 업로드 영역 */}
=======
>>>>>>> 1a99a49 (자소서 업로드)
        <div className="w-full max-w-md space-y-4">
          <div
            onClick={handleBoxClick}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
              dragActive ? 'border-coral-400 bg-coral-50' : error ? 'border-red-300 bg-red-50' : 'border-coral-300 bg-white'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="flex items-center justify-between">
              <span className={file ? 'text-gray-700' : 'text-coral-500'}>{isUploading ? '업로드 중...' : fileName}</span>
              <Upload className="w-5 h-5 text-coral-500" />
              <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.doc,.docx,.txt" disabled={isUploading} />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!file || isUploading}
            className={`w-full font-medium py-4 rounded-2xl transition-colors ${
              file && !isUploading ? 'bg-coral-400 hover:bg-coral-500 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isUploading ? '업로드 중...' : '제출하기'}
          </button>
        </div>
      </div>

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
        .text-coral-500 {
          color: #ff7f66;
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
