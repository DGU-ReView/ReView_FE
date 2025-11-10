import { useState } from 'react';
import { Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import InterviewLayout from '@/layouts/InterviewLayout';

export default function MyInterview() {
  const navigate = useNavigate();
  const [fileName, setFileName] = useState('파일 업로드');
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFileName(e.dataTransfer.files[0].name);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
    }
  };

  const handleBoxClick = () => {
    document.getElementById('file-upload')?.click();
  };

  const handleSubmit = () => {
    navigate('/upload-done');
  };

  return (
    <InterviewLayout activeMenu="upload">
      {/* 중앙 컨텐츠 영역 */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <p className="text-gray-700 text-lg mb-8">자소서를 업로드해주세요.</p>
        
        {/* 파일 업로드 영역 */}
        <div className="w-full max-w-md space-y-4">
          <div
            onClick={handleBoxClick}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
              dragActive
                ? 'border-coral-400 bg-coral-50'
                : 'border-coral-300 bg-white'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="flex items-center justify-between">
              <span className="text-coral-500">{fileName}</span>
              <Upload className="w-5 h-5 text-coral-500" />
              <input
                id="file-upload"
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.txt"
              />
            </div>
          </div>

          <button 
            onClick={handleSubmit}
            className="w-full bg-coral-400 hover:bg-coral-500 text-white font-medium py-4 rounded-2xl transition-colors"
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