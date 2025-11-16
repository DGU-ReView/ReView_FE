import type { ReactNode } from 'react';

interface IInterviewLayoutProps {
  children: ReactNode;
  activeMenu: 'upload' | 'answer' | 'feedback';
}

export default function InterviewLayout({ children, activeMenu }: IInterviewLayoutProps) {
  return (
    <div className="max-w-7xl mx-auto px-8 py-12">
      {/* 제목 */}
      <div className="mb-12">
        <h1 className="text-sm font-semibold text-gray-600 mb-2">MY:INTERVIEW</h1>
        <h2 className="text-4xl font-bold text-gray-900">나의 면접 피드백</h2>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="flex gap-8">
        {/* 왼쪽 사이드 메뉴 - 공통 부분 */}
        <div className="w-59 flex flex-col gap-4">
          <button
            className={`py-4 px-6 rounded-2xl text-center font-medium transition-all ${
              activeMenu === 'upload' ? 'bg-white shadow-lg text-gray-900' : 'bg-white/50 text-gray-600 hover:bg-white/70'
            }`}
          >
            자소서 업로드
          </button>
          <button
            className={`py-4 px-6 rounded-2xl text-center font-medium transition-all ${
              activeMenu === 'answer' ? 'bg-white shadow-lg text-gray-900' : 'bg-white/50 text-gray-600 hover:bg-white/70'
            }`}
          >
            답변 작성
          </button>
          <button
            className={`py-4 px-6 rounded-2xl text-center font-medium transition-all ${
              activeMenu === 'feedback' ? 'bg-white shadow-lg text-gray-900' : 'bg-white/50 text-gray-600 hover:bg-white/70'
            }`}
          >
            피드백 확인
          </button>
        </div>

        {/* 페이지별 컨텐츠 */}
        {children}
      </div>
    </div>
  );
}
