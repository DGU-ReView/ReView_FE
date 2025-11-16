// src/services/interviewApi.ts
import apiClient from './api';

/* ====================================================
   공통: BE 응답(result 래핑 유무 모두 대응)
==================================================== */
const unwrapResult = <T>(data: any): T => {
  if (data && typeof data === 'object' && 'result' in data) {
    return (data as { result: T }).result;
  }
  return data as T;
};

/* ====================================================
   1) 자소서 업로드용 Presigned URL & 업로드
==================================================== */

/** 자소서 업로드용 Presigned URL 응답 (POST /api/presign/resume) */
export interface IResumePresignResponse {
  uploadUrl: string;
  key: string;
  requiredHeaders: { [header: string]: string };
}

/** 자소서 업로드용 프리사인 URL 발급 */
export const getResumePresignUrl = async (fileName: string): Promise<IResumePresignResponse> => {
  const response = await apiClient.post('/api/presign/resume', null, { params: { fileName } });
  return unwrapResult<IResumePresignResponse>(response.data);
};

/** S3 공통 업로드 헬퍼 (resume / recording 공용) */
export const uploadToS3 = async (
  presignedUrl: string,
  file: File | Blob,
  extraHeaders: Record<string, string> = {},
): Promise<void> => {
  const baseHeaders: Record<string, string> = {};
  if ((file as any).type) baseHeaders['Content-Type'] = (file as any).type;

  const uploadResponse = await fetch(presignedUrl, {
    method: 'PUT',
    body: file,
    headers: { ...baseHeaders, ...extraHeaders },
  });
  if (!uploadResponse.ok) throw new Error(`S3 업로드 실패: ${uploadResponse.status}`);
};

/** S3 key에서 resumeId 추출 (예: resume/123/aaa-bbb.docx → aaa-bbb) */
export const extractResumeId = (resumeKey: string): string => {
  const parts = resumeKey.split('/');
  const fileName = parts[parts.length - 1];
  return fileName.split('.').slice(0, -1).join('.');
};

/** 자소서 업로드 전체 플로우: key 반환 */
export const uploadResume = async (file: File): Promise<string> => {
  try {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['pdf', 'docx'].includes(ext)) throw new Error('PDF 또는 DOCX 파일만 업로드 가능합니다.');
    const { uploadUrl, key, requiredHeaders } = await getResumePresignUrl(file.name);
    await uploadToS3(uploadUrl, file, requiredHeaders);
    return key;
  } catch (e) {
    console.error('❌ 자소서 업로드 실패:', e);
    throw e;
  }
};

/* ====================================================
   2) 인터뷰 세션 생성 (자소서 기반 첫 질문 생성)
==================================================== */

export type TInterviewType = 'normal' | 'pressure';
export type TInterviewMode = 'NORMAL' | 'HARD';

export interface ICreateInterviewSessionRequest {
  resumeKey: string;   // S3 objectKey
  jobTitle: string;    // 직무명
  interviewType: TInterviewType; // 'normal' | 'pressure'
}

/** BE에 보내는 실제 payload */
interface ICreateInterviewSessionPayload {
  mode: TInterviewMode;
  jobRole: string;
  resumeId: string;
}

/** BE 원본 응답(result 내부) */
interface ICreateInterviewSessionApiResponse {
  sessionId: number;
  firstQuestionId: number;
  firstQuestionText: string;
}

/** 프론트 질문 타입 */
export interface IQuestion {
  questionId: string;
  mainQuestion: string;
  subQuestion: string;
  order: number;
}

export interface ICreateInterviewSessionResponse {
  sessionId: string;
  firstQuestion: IQuestion;
}

export const createInterviewSession = async (
  data: ICreateInterviewSessionRequest,
): Promise<ICreateInterviewSessionResponse> => {
  try {
    const resumeId = extractResumeId(data.resumeKey);
    const mode: TInterviewMode = data.interviewType === 'pressure' ? 'HARD' : 'NORMAL';

    const payload: ICreateInterviewSessionPayload = {
      mode,
      jobRole: data.jobTitle,
      resumeId,
    };

    const response = await apiClient.post('/api/interview-sessions', payload);
    const apiResult = unwrapResult<ICreateInterviewSessionApiResponse>(response.data);

    return {
      sessionId: String(apiResult.sessionId),
      firstQuestion: {
        questionId: String(apiResult.firstQuestionId),
        mainQuestion: apiResult.firstQuestionText,
        subQuestion: '',
        order: 1,
      },
    };
  } catch (error: any) {
    console.error('❌ createInterviewSession 에러:', {
      message: error?.message,
      data: error?.response?.data,
      status: error?.response?.status,
    });
    throw error;
  }
};

/* ====================================================
   3) 녹음 업로드 Presign URL
==================================================== */
interface IRecordingPresignRequest {
  questionId: number;
  contentType: string;
}
export interface IRecordingPresignResponse {
  uploadUrl: string;
  key: string;
  requiredHeaders: Record<string, string>;
}

export const getRecordingPresignUrl = async (
  questionId: number,
  contentType: string,
): Promise<IRecordingPresignResponse> => {
  const payload: IRecordingPresignRequest = { questionId, contentType };
  const response = await apiClient.post('/api/presign/recording', payload);
  return unwrapResult<IRecordingPresignResponse>(response.data);
};

/* ====================================================
   4) recording 저장 & Polling 타입
==================================================== */
export type TRecordingEnqueueStatus = 'UPLOADED';
export interface ISaveRecordingResponse {
  recordingId: number;
  status: TRecordingEnqueueStatus;
}
export const saveRecording = async (questionId: number): Promise<ISaveRecordingResponse> => {
  const response = await apiClient.post(`/api/questions/${questionId}/recordings`);
  return unwrapResult<ISaveRecordingResponse>(response.data);
};

export type TRecordingResultStatus = 'WORKING' | 'READY' | 'FAILED';
export type TNextQuestionType = 'FOLLOW_UP' | 'ROOT' | 'NONE';

export interface IRecordingResultNext {
  type: TNextQuestionType;
  nextQuestionId: number | null;
  nextQuestionText: string | null;
  rootId: number | null;
  rootText: string | null;
  rootIndex: number | null;
}

export interface IRecordingResultResponse {
  sessionId: number;
  status: TRecordingResultStatus;
  next: IRecordingResultNext | null;
}

export const getRecordingResult = async (recordingId: number): Promise<IRecordingResultResponse> => {
  const response = await apiClient.get(`/api/recordings/${recordingId}/results`);
  return unwrapResult<IRecordingResultResponse>(response.data);
};

/** next 객체 → IQuestion 매핑 */
const mapNextToQuestion = (next: IRecordingResultNext | null): IQuestion | null => {
  if (!next || next.type === 'NONE' || next.nextQuestionId == null) return null;
  const isFollowUp = next.type === 'FOLLOW_UP';
  return {
    questionId: String(next.nextQuestionId),
    mainQuestion: isFollowUp ? (next.rootText ?? '') : (next.nextQuestionText ?? ''),
    subQuestion: isFollowUp ? (next.nextQuestionText ?? '') : '',
    order: next.rootIndex ?? 0,
  };
};

/** Polling: READY/FAILED까지 반복 조회 */
export const pollRecordingResult = async (
  recordingId: number,
  maxAttempts = 60,
  intervalMs = 3000,
): Promise<IRecordingResultResponse> => {
  let attempts = 0;
  while (attempts < maxAttempts) {
    const result = await getRecordingResult(recordingId);
    if (result.status === 'READY' || result.status === 'FAILED') return result;
    await new Promise((r) => setTimeout(r, intervalMs));
    attempts += 1;
  }
  throw new Error('Polling timeout - 녹음 처리 대기 시간이 너무 깁니다.');
};

/* ====================================================
   5) 녹음 파일 업로드 & 다음 질문 받기 (통합 플로우)
==================================================== */
export const uploadRecordingAndGetNext = async (
  questionId: string | number,
  audioBlob: Blob,
): Promise<IQuestion | null> => {
  const numericId = typeof questionId === 'string' ? Number(questionId) : questionId;
  if (Number.isNaN(numericId)) throw new Error('유효하지 않은 questionId 입니다.');

  const contentType = (audioBlob as any).type || 'audio/webm';
  const { uploadUrl, requiredHeaders } = await getRecordingPresignUrl(numericId, contentType);
  await uploadToS3(uploadUrl, audioBlob, requiredHeaders);

  const { recordingId } = await saveRecording(numericId);
  const result = await pollRecordingResult(recordingId);
  if (result.status === 'FAILED') throw new Error('녹음 처리 중 오류가 발생했습니다.');

  return mapNextToQuestion(result.next);
};

/* ====================================================
   6) 시간초과 Timeout
==================================================== */
/** BE Timeout 원본 응답 */
export interface ITimeoutResponse {
  sessionId: number;
  status: 'READY';
  next: IRecordingResultNext | null;
}

/**
 * 시간초과 처리: 바로 다음 질문(IQuestion) 또는 null(세션 종료) 반환
 *  - 서버가 next.type === ROOT / FOLLOW_UP / NONE 형태로 내려줌
 */
export const sendTimeout = async (questionId: string | number): Promise<IQuestion | null> => {
  const response = await apiClient.post(`/api/questions/${questionId}/timeout`);
  const data = unwrapResult<ITimeoutResponse>(response.data);
  return mapNextToQuestion(data.next); // ← 핵심: 다음 질문 매핑
};

/** 기존 헬퍼와의 호환 (별칭) */
export const timeoutAndGetNextQuestion = async (
  questionId: string | number,
): Promise<IQuestion | null> => sendTimeout(questionId);

/* ====================================================
   7) 최종 피드백 조회
==================================================== */
export type TFeedbackProgressStatus = 'WORKING' | 'READY' | 'FAILED';
export type TFeedbackTurnType = 'QUESTION' | 'ANSWER';

export interface IQnaTurn {
  turn: TFeedbackTurnType;
  content: string;
}

export interface IQuestionSummary {
  questionNumber: number;
  rootQuestion: string;
  aiFeedback: string | null;
  selfFeedback: string | null;
  qnaTurns: IQnaTurn[];
}

export interface IInterviewSummary {
  interviewTitle: string;
  timeoutQuestionNumber: number;
  questionSummaries: IQuestionSummary[];
}

export interface IFinalFeedbackResponse {
  feedbackProgressStatus: TFeedbackProgressStatus;
  interviewSummary: IInterviewSummary | null;
  feedbacks: {
    feedbackType: 'positive' | 'improvement';
    answer: string;
    timeout: boolean;
    feedback: string;
    questionId: number;
    question: string;
  }[];
  totalQuestions: number;
  timeoutCount: number;
}

export const getFinalFeedback = async (
  sessionId: string | number,
): Promise<IFinalFeedbackResponse> => {
  const response = await apiClient.get(`/api/interview-sessions/${sessionId}`);
  return unwrapResult<IFinalFeedbackResponse>(response.data);
};
