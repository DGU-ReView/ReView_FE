// Mock API - 백엔드 서버 없이 테스트용

export const mockUploadResume = async (file: File): Promise<string> => {
  console.log('📁 [MOCK] 자소서 업로드:', file.name);

  // 2초 대기 (실제 업로드 시뮬레이션)
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Mock fileKey 반환
  const mockFileKey = `resume/${Date.now()}-${file.name}`;
  console.log('✅ [MOCK] 업로드 완료! fileKey:', mockFileKey);

  return mockFileKey;
};

export const mockCreateInterviewSession = async (data: any) => {
  console.log('🎤 [MOCK] 면접 세션 생성:', data);

  await new Promise((resolve) => setTimeout(resolve, 2000));

  return {
    sessionId: 'mock-session-' + Date.now(),
    firstQuestion: {
      questionId: 'q1',
      mainQuestion: '메인질문',
      subQuestion: '간단히 자기소개를 해주세요.',
      order: 1,
    },
  };
};

export const mockUploadRecording = async (questionId: string, audioBlob: Blob) => {
  console.log('🎙️ [MOCK] 녹음 업로드:', questionId, audioBlob.size, 'bytes');

  await new Promise((resolve) => setTimeout(resolve, 3000));

  return {
    questionId: 'q2',
    mainQuestion: '메인질문',
    subQuestion: '이 직무를 선택한 이유는 무엇인가요?',
    order: 2,
  };
};

export const mockGetFinalFeedback = async (sessionId: string) => {
  console.log('📊 [MOCK] 최종 피드백 조회:', sessionId);

  await new Promise((resolve) => setTimeout(resolve, 1000));

  return {
    sessionId: sessionId,
    totalQuestions: 4,
    timeoutCount: 1,
    feedbacks: [
      {
        questionId: 'q1',
        question: '간단히 자기소개를 해주세요.',
        answer: '안녕하세요. 저는...',
        feedback: '답변이 명확하고 간결했습니다. 다만 더 구체적인 경험을 추가하면 좋겠습니다.',
        feedbackType: 'positive' as const,
        timeout: false,
      },
      {
        questionId: 'q2',
        question: '이 직무를 선택한 이유는 무엇인가요?',
        answer: '',
        feedback: '시간 내에 답변하지 못했습니다.',
        feedbackType: 'negative' as const,
        timeout: true,
      },
    ],
  };
};
