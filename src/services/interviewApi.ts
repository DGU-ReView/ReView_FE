import apiClient from './api';

// ==================== 타입 정의 ====================

/** 자소서 업로드용 Presigned URL 응답 (POST /api/presign/resume) */
export interface IResumePresignResponse {
  uploadUrl: string;
  key: string;
  requiredHeaders: { [header: string]: string };
}

/** 녹음 업로드용 Presigned URL 응답 (POST /api/presign/recording) */
export interface IPresignUrlResponse {
  presignedUrl: string;
  fileKey: string;
}

/** 면접 세션 생성 요청 */
export interface ICreateInterviewSessionRequest {
  resumeKey: string;
  jobTitle: string;
  interviewType: 'normal' | 'pressure';
}

/** 질문 정보 */
export interface IQuestion {
  questionId: string;
  mainQuestion: string;
  subQuestion: string;
  order: number;
}

/** 면접 세션 생성 응답 */
export interface ICreateInterviewSessionResponse {
  sessionId: string;
  firstQuestion: IQuestion;
}

/** 녹음 저장 요청 */
export interface ISaveRecordingRequest {
  recordingKey: string;
}

/** 녹음 저장 응답 */
export interface ISaveRecordingResponse {
  recordingId: string;
  status: 'processing' | 'completed' | 'failed';
  nextQuestion?: IQuestion;
}

/** 녹음 처리 결과 */
export interface IRecordingResultResponse {
  status: 'processing' | 'completed' | 'failed';
  nextQuestion?: IQuestion;
  feedback?: string;
}

/** 피드백 한 항목 */
export interface IFeedbackItem {
  questionId: string;
  question: string;
  answer: string;
  feedback: string;
  feedbackType: 'positive' | 'negative';
  timeout: boolean;
}

/** 최종 피드백 응답 */
export interface IFinalFeedbackResponse {
  sessionId: string;
  feedbacks: IFeedbackItem[];
  totalQuestions: number;
  timeoutCount: number;
}

// ==================== API 함수들 ====================

/** 1. 자소서 업로드용 프리사인 URL 발급 */
export const getResumePresignUrl = async (fileName: string): Promise<IResumePresignResponse> => {
  const response = await apiClient.post<IResumePresignResponse>('/api/presign/resume', { fileName });
  return response.data;
};

/** 2. 녹음 업로드용 프리사인 URL 발급 */
export const getRecordingPresignUrl = async (fileName: string): Promise<IPresignUrlResponse> => {
  const response = await apiClient.post<IPresignUrlResponse>('/api/presign/recording', { fileName });
  return response.data;
};

/** 3. S3에 파일 업로드 (프리사인 URL 사용) */
export const uploadToS3 = async (presignedUrl: string, file: File | Blob, extraHeaders: Record<string, string> = {}): Promise<void> => {
  await fetch(presignedUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type || 'application/octet-stream', ...extraHeaders },
  });
};

/** S3 key에서 resumeId 추출 */
export const extractResumeId = (resumeKey: string): string => {
  const parts = resumeKey.split('/');
  const fileName = parts[parts.length - 1];
  const nameWithoutExt = fileName.split('.').slice(0, -1).join('.');
  return nameWithoutExt;
};

/** 4. 자소서 기반 질문 생성 및 첫번째 질문 조회 */
export const createInterviewSession = async (data: ICreateInterviewSessionRequest): Promise<ICreateInterviewSessionResponse> => {
  const response = await apiClient.post<ICreateInterviewSessionResponse>('/api/interview-sessions', data);
  return response.data;
};

/** 5. recording 저장 및 프리질문 생성 (비동기) */
export const saveRecording = async (questionId: string, data: ISaveRecordingRequest): Promise<ISaveRecordingResponse> => {
  const response = await apiClient.post<ISaveRecordingResponse>(`/api/questions/${questionId}/recordings`, data);
  return response.data;
};

/** 6. recording 저장 및 프리질문 생성 상태 Polling */
export const getRecordingResult = async (recordingId: string): Promise<IRecordingResultResponse> => {
  const response = await apiClient.get<IRecordingResultResponse>(`/api/recordings/${recordingId}/results`);
  return response.data;
};

/** 7. Polling 헬퍼 함수 (자동으로 상태 확인) */
export const pollRecordingResult = async (recordingId: string, maxAttempts: number = 60, interval: number = 5000): Promise<IRecordingResultResponse> => {
  let attempts = 0;
  while (attempts < maxAttempts) {
    const result = await getRecordingResult(recordingId);
    if (result.status === 'completed' || result.status === 'failed') return result;
    await new Promise((resolve) => setTimeout(resolve, interval));
    attempts++;
  }
  throw new Error('Polling timeout - 처리 시간이 너무 오래 걸립니다.');
};

/** 8. 사용자가 시간초과로 답변하지 못한 경우 */
export const sendTimeout = async (questionId: string): Promise<void> => {
  await apiClient.post(`/api/questions/${questionId}/timeout`);
};

/** 9. 최종 피드백 조회 */
export const getFinalFeedback = async (sessionId: string): Promise<IFinalFeedbackResponse> => {
  const response = await apiClient.get<IFinalFeedbackResponse>(`/api/interview-sessions/${sessionId}`);
  return response.data;
};

// ==================== 전체 플로우 헬퍼 함수 ====================

/** 자소서 업로드 전체 플로우 */
export const uploadResume = async (file: File): Promise<string> => {
  try {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !['pdf', 'docx'].includes(extension)) throw new Error('PDF 또는 DOCX 파일만 업로드 가능합니다.');
    const { uploadUrl, key, requiredHeaders } = await getResumePresignUrl(file.name);
    const uploadResponse = await fetch(uploadUrl, { method: 'PUT', headers: { ...requiredHeaders }, body: file });
    if (!uploadResponse.ok) throw new Error(`S3 업로드 실패: ${uploadResponse.status}`);
    return key;
  } catch (error) {
    console.error('❌ 자소서 업로드 실패:', error);
    throw error;
  }
};

/** 녹음 파일 업로드 및 다음 질문 받기 전체 플로우 */
export const uploadRecordingAndGetNext = async (questionId: string, audioBlob: Blob): Promise<IQuestion | null> => {
  const fileName = `recording-${questionId}-${Date.now()}.webm`;
  const { presignedUrl, fileKey } = await getRecordingPresignUrl(fileName);
  await uploadToS3(presignedUrl, audioBlob);
  const { recordingId, status, nextQuestion } = await saveRecording(questionId, { recordingKey: fileKey });
  if (status === 'completed') return nextQuestion || null;
  const result = await pollRecordingResult(recordingId);
  if (result.status === 'failed') throw new Error('녹음 처리에 실패했습니다.');
  return result.nextQuestion || null;
};
