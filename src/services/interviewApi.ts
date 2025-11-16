import apiClient from './api';

// ==================== 타입 정의 ====================

/**
 * 자소서 업로드용 Presigned URL 응답
 * (POST /api/presign/resume)
 */
export interface ResumePresignResponse {
  uploadUrl: string;
  key: string;
  requiredHeaders: {
    [header: string]: string;
  };
}

/**
 * 녹음 업로드용 Presigned URL 응답
 * (POST /api/presign/recording)
 * presignedUrl 로 PUT 업로드, fileKey 는 S3 key
 */
export interface PresignUrlResponse {
  presignedUrl: string;
  fileKey: string;
}

/**
 * 면접 세션 생성 요청
 */
export interface CreateInterviewSessionRequest {
  resumeKey: string;
  jobTitle: string;
  interviewType: 'normal' | 'pressure';
}

/**
 * 질문 정보
 */
export interface Question {
  questionId: string;
  mainQuestion: string;
  subQuestion: string;
  order: number;
}

/**
 * 면접 세션 생성 응답
 */
export interface CreateInterviewSessionResponse {
  sessionId: string;
  firstQuestion: Question;
}

/**
 * 녹음 저장 요청
 */
export interface SaveRecordingRequest {
  recordingKey: string;
}

/**
 * 녹음 저장 응답
 */
export interface SaveRecordingResponse {
  recordingId: string;
  status: 'processing' | 'completed' | 'failed';
  nextQuestion?: Question;
}

/**
 * 녹음 처리 결과
 */
export interface RecordingResultResponse {
  status: 'processing' | 'completed' | 'failed';
  nextQuestion?: Question;
  feedback?: string;
}

/**
 * 피드백 한 항목
 */
export interface FeedbackItem {
  questionId: string;
  question: string;
  answer: string;
  feedback: string;
  feedbackType: 'positive' | 'negative';
  timeout: boolean;
}

/**
 * 최종 피드백 응답
 */
export interface FinalFeedbackResponse {
  sessionId: string;
  feedbacks: FeedbackItem[];
  totalQuestions: number;
  timeoutCount: number;
}

// ==================== API 함수들 ====================

/**
 * 1. 자소서 업로드용 프리사인 URL 발급
 *    (스펙: POST /api/presign/resume, JSON body { fileName })
 */
export const getResumePresignUrl = async (
  fileName: string,
): Promise<ResumePresignResponse> => {
  const response = await apiClient.post<ResumePresignResponse>(
    '/api/presign/resume',
    { fileName },
  );
  return response.data;
};

/**
 * 2. 녹음 업로드용 프리사인 URL 발급
 *    (POST /api/presign/recording, body { fileName } – 기존 방식 유지)
 */
export const getRecordingPresignUrl = async (
  fileName: string,
): Promise<PresignUrlResponse> => {
  const response = await apiClient.post<PresignUrlResponse>(
    '/api/presign/recording',
    { fileName },
  );
  return response.data;
};

/**
 * 3. S3에 파일 업로드 (프리사인 URL 사용)
 */
export const uploadToS3 = async (
  presignedUrl: string,
  file: File | Blob,
  extraHeaders: Record<string, string> = {},
): Promise<void> => {
  await fetch(presignedUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
      ...extraHeaders,
    },
  });
};

/**
 * 4. 자소서 기반 질문 생성 및 첫번째 질문 조회
 */
export const createInterviewSession = async (
  data: CreateInterviewSessionRequest,
): Promise<CreateInterviewSessionResponse> => {
  const response = await apiClient.post<CreateInterviewSessionResponse>(
    '/api/interview-sessions',
    data,
  );
  return response.data;
};

/**
 * 5. recording 저장 및 프리질문 생성 (비동기)
 */
export const saveRecording = async (
  questionId: string,
  data: SaveRecordingRequest,
): Promise<SaveRecordingResponse> => {
  const response = await apiClient.post<SaveRecordingResponse>(
    `/api/questions/${questionId}/recordings`,
    data,
  );
  return response.data;
};

/**
 * 6. recording 저장 및 프리질문 생성 상태 Polling
 */
export const getRecordingResult = async (
  recordingId: string,
): Promise<RecordingResultResponse> => {
  const response = await apiClient.get<RecordingResultResponse>(
    `/api/recordings/${recordingId}/results`,
  );
  return response.data;
};

/**
 * 7. Polling 헬퍼 함수 (자동으로 상태 확인)
 */
export const pollRecordingResult = async (
  recordingId: string,
  maxAttempts: number = 60, // 최대 60번 (5분)
  interval: number = 5000, // 5초마다
): Promise<RecordingResultResponse> => {
  let attempts = 0;

  while (attempts < maxAttempts) {
    const result = await getRecordingResult(recordingId);

    if (result.status === 'completed' || result.status === 'failed') {
      return result;
    }

    // processing 상태면 대기 후 재시도
    await new Promise((resolve) => setTimeout(resolve, interval));
    attempts++;
  }

  throw new Error('Polling timeout - 처리 시간이 너무 오래 걸립니다.');
};

/**
 * 8. 사용자가 시간초과로 답변하지 못한 경우
 */
export const sendTimeout = async (questionId: string): Promise<void> => {
  await apiClient.post(`/api/questions/${questionId}/timeout`);
};

/**
 * 9. 최종 피드백 조회
 */
export const getFinalFeedback = async (
  sessionId: string,
): Promise<FinalFeedbackResponse> => {
  const response = await apiClient.get<FinalFeedbackResponse>(
    `/api/interview-sessions/${sessionId}`,
  );
  return response.data;
};

// ==================== 전체 플로우 헬퍼 함수 ====================

/**
 * 자소서 업로드 전체 플로우
 *  - 확장자 검증(pdf/docx)
 *  - presign URL 발급
 *  - S3 PUT 업로드
 *  - S3 key 반환
 */
export const uploadResume = async (file: File): Promise<string> => {
  try {
    // 0. 확장자 검증 (pdf, docx만)
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !['pdf', 'docx'].includes(extension)) {
      throw new Error('PDF 또는 DOCX 파일만 업로드 가능합니다.');
    }

    // 1단계: Presigned URL 받기
    console.log('🚀 1단계 - Presigned URL 요청:', file.name);

    const { uploadUrl, key, requiredHeaders } = await getResumePresignUrl(
      file.name,
    );

    console.log('✅ Presigned URL 발급 성공');

    // 2단계: S3에 실제 파일 업로드 (PUT)
    console.log('📤 2단계 - S3 업로드 시작');

    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        ...requiredHeaders, // Content-Type 등 필수 헤더
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error(`S3 업로드 실패: ${uploadResponse.status}`);
    }

    console.log('✅ S3 업로드 완료! Key:', key);

    return key;
  } catch (error) {
    console.error('❌ 자소서 업로드 실패:', error);
    throw error;
  }
};

/**
 * 녹음 파일 업로드 및 다음 질문 받기 전체 플로우
 */
export const uploadRecordingAndGetNext = async (
  questionId: string,
  audioBlob: Blob,
): Promise<Question | null> => {
  // 1. 프리사인 URL 받기
  const fileName = `recording-${questionId}-${Date.now()}.webm`;
  const { presignedUrl, fileKey } = await getRecordingPresignUrl(fileName);

  // 2. S3에 업로드
  await uploadToS3(presignedUrl, audioBlob);

  // 3. 녹음 저장 및 처리 시작
  const { recordingId, status, nextQuestion } = await saveRecording(questionId, {
    recordingKey: fileKey,
  });

  // 4. 즉시 완료된 경우
  if (status === 'completed') {
    return nextQuestion || null;
  }

  // 5. 처리 중이면 polling
  const result = await pollRecordingResult(recordingId);

  if (result.status === 'failed') {
    throw new Error('녹음 처리에 실패했습니다.');
  }

  return result.nextQuestion || null;
};
