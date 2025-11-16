import { type ChangeEvent, type DragEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload } from 'lucide-react';

import InterviewLayout from '@/layouts/InterviewLayout';
import { uploadResume } from '@/services/interviewApi';
import orangeFrog from '@/assets/orangeFrog.svg';

const ALLOWED_EXTENSIONS = ['.pdf', '.docx'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function MyInterview() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('파일 업로드');
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const validateFile = (targetFile: File): boolean => {
    setError('');

    const extension = '.' + (targetFile.name.split('.').pop() ?? '').toLowerCase();

    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      setError('PDF, DOCX 파일만 업로드 가능합니다.');
      return false;
    }

    if (targetFile.size > MAX_FILE_SIZE) {
      setError('파일 크기는 10MB를 초과할 수 없습니다.');
      return false;
    }

    return true;
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

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

      const fileKey = await uploadResume(file);

      console.log('✅ 자소서 업로드 성공! fileKey:', fileKey);

      navigate('/upload-done', {
        state: {
          file,
          fileName,
          resumeKey: fileKey,
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

        {error && (
          <div className="w-full max-w-md mb-4">
            <p className="text-red-500 text-sm text-center">{error}</p>
          </div>
        )}

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
              <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.docx" disabled={isUploading} />
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
        <img src={orangeFrog} alt="리뷰캐릭터" className="w-64 h-auto" />
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
