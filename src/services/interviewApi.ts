import apiClient from './api';

// =====================================================
// 공통: BE 응답(result 래핑 유무 모두 대응)
// =====================================================
const unwrapResult = <T>(data: any): T => {
  if (data && typeof data === 'object' && 'result' in data) {
    return (data as { result: T }).result;
  }
  return data as T;
};

// =====================================================
// 1. 자소서 업로드용 Presigned URL & 업로드
// =====================================================

/** 자소서 업로드용 Presigned URL 응답 (POST /api/presign/resume) */
export interface IResumePresignResponse {
  uploadUrl: string;
  key: string;
  requiredHeaders: { [header: string]: string };
}

/** 자소서 업로드용 프리사인 URL 발급 */
export const getResumePresignUrl = async (
  fileName: string,
): Promise<IResumePresignResponse> => {
  const response = await apiClient.post(
    '/api/presign/resume',
    null,
    {
      params: { fileName },
    },
  );

  return unwrapResult<IResumePresignResponse>(response.data);
};

/** S3 공통 업로드 헬퍼 (resume / recording 둘 다 사용) */
export const uploadToS3 = async (
  presignedUrl: string,
  file: File | Blob,
  extraHeaders: Record<string, string> = {},
): Promise<void> => {
  const baseHeaders: Record<string, string> = {};

  // Blob에 type이 있으면 기본 Content-Type으로 사용
  if ((file as any).type) {
    baseHeaders['Content-Type'] = (file as any).type;
  }

  const uploadResponse = await fetch(presignedUrl, {
    method: 'PUT',
    body: file,
    headers: {
      ...baseHeaders,
      ...extraHeaders, // presign에서 내려준 헤더가 우선
    },
  });

  if (!uploadResponse.ok) {
    throw new Error(`S3 업로드 실패: ${uploadResponse.status}`);
  }
};

/** S3 key에서 resumeId 추출 (예: resume/123/aaa-bbb.docx → aaa-bbb) */
export const extractResumeId = (resumeKey: string): string => {
  const parts = resumeKey.split('/');
  const fileName = parts[parts.length - 1];
  const nameWithoutExt = fileName.split('.').slice(0, -1).join('.');
  return nameWithoutExt;
};

/** 자소서 업로드 전체 플로우: key 반환 */
export const uploadResume = async (file: File): Promise<string> => {
  try {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !['pdf', 'docx'].includes(extension)) {
      throw new Error('PDF 또는 DOCX 파일만 업로드 가능합니다.');
    }

    const { uploadUrl, key, requiredHeaders } = await getResumePresignUrl(file.name);

    await uploadToS3(uploadUrl, file, requiredHeaders);

    return key;
  } catch (error) {
    console.error('❌ 자소서 업로드 실패:', error);
    throw error;
  }
};

// =====================================================
// 2. 인터뷰 세션 생성 (자소서 기반 첫 질문 생성)
// =====================================================

/** 프론트에서 쓰는 인터뷰 타입 */
export type InterviewType = 'normal' | 'pressure';

/** BE에서 사용하는 면접 모드 */
export type InterviewMode = 'NORMAL' | 'HARD';

/** 프론트에서 쓰는 요청 타입 */
export interface ICreateInterviewSessionRequest {
  /** S3 objectKey (예: resume/123/abcd-efgh.docx) */
  resumeKey: string;
  /** 직무 이름 */
  jobTitle: string;
  /** 'normal' | 'pressure' → NORMAL | HARD 로 매핑 */
  interviewType: InterviewType;
}

/** BE에 실제로 보내는 payload (mode / jobRole / resumeId) */
interface ICreateInterviewSessionPayload {
  mode: InterviewMode;
  jobRole: string;
  resumeId: string;
}

/** BE 응답 원본 타입 (result 내부) */
interface ICreateInterviewSessionApiResponse {
  sessionId: number;
  firstQuestionId: number;
  firstQuestionText: string;
}

/** 프론트에서 쓰기 좋은 형태 */
export interface IQuestion {
  questionId: string;
  mainQuestion: string;
  subQuestion: string;
  order: number;
}

/** 프론트에서 최종으로 받는 응답 타입 */
export interface ICreateInterviewSessionResponse {
  sessionId: string;
  firstQuestion: IQuestion;
}

/** 자소서 기반 질문 생성 및 첫번째 질문 조회 */
export const createInterviewSession = async (
  data: ICreateInterviewSessionRequest,
): Promise<ICreateInterviewSessionResponse> => {
  try {
    console.log('🎬 API 호출: /api/interview-sessions');
    console.log('- resumeKey:', data.resumeKey);
    console.log('- jobTitle:', data.jobTitle);
    console.log('- interviewType:', data.interviewType);

    const resumeId = extractResumeId(data.resumeKey);
    const mode: InterviewMode = data.interviewType === 'pressure' ? 'HARD' : 'NORMAL';

    const payload: ICreateInterviewSessionPayload = {
      mode,
      jobRole: data.jobTitle,
      resumeId,
    };

    console.log('📤 요청 payload:', payload);

    const response = await apiClient.post('/api/interview-sessions', payload);

    console.log('📥 원본 응답:', response.data);

    const apiResult = unwrapResult<ICreateInterviewSessionApiResponse>(response.data);

    console.log('✅ unwrap 후 결과:', apiResult);

    const firstQuestion: IQuestion = {
      questionId: String(apiResult.firstQuestionId),
      mainQuestion: apiResult.firstQuestionText,
      subQuestion: '',
      order: 1,
    };

    const result = {
      sessionId: String(apiResult.sessionId),
      firstQuestion,
    };

    console.log('✅ 최종 반환값:', result);

    return result;
  } catch (error: any) {
    console.error('❌ createInterviewSession 에러:');
    console.error('- 에러 객체:', error);
    console.error('- 에러 메시지:', error.message);
    console.error('- 응답 데이터:', error.response?.data);
    console.error('- 응답 상태:', error.response?.status);
    throw error;
  }
};

// =====================================================
// 3. 녹음 업로드 Presign URL (POST /api/presign/recording)
// =====================================================

/** 녹음 Presign 요청 */
interface IRecordingPresignRequest {
  questionId: number;
  contentType: string;
}

/** 녹음 Presign 응답 */
export interface IRecordingPresignResponse {
  uploadUrl: string;
  key: string;
  requiredHeaders: Record<string, string>;
}

/** 녹음 업로드용 프리사인 URL 발급 */
export const getRecordingPresignUrl = async (
  questionId: number,
  contentType: string,
): Promise<IRecordingPresignResponse> => {
  const payload: IRecordingPresignRequest = { questionId, contentType };

  const response = await apiClient.post('/api/presign/recording', payload);
  return unwrapResult<IRecordingPresignResponse>(response.data);
};

// =====================================================
// 4. recording 저장 (비동기 트리거) & Polling 타입들
// =====================================================

/** 녹음 제출 API 응답 status (현재 스펙상 UPLOADED 고정) */
export type RecordingEnqueueStatus = 'UPLOADED';

/** 녹음 저장 응답 (POST /api/questions/{questionId}/recordings) */
export interface ISaveRecordingResponse {
  recordingId: number;
  status: RecordingEnqueueStatus;
}

/** 녹음 저장 및 꼬리질문 생성 API (비동기, 바로 응답) */
export const saveRecording = async (
  questionId: number,
): Promise<ISaveRecordingResponse> => {
  const response = await apiClient.post(`/api/questions/${questionId}/recordings`);
  return unwrapResult<ISaveRecordingResponse>(response.data);
};

/** Polling API status */
export type RecordingResultStatus = 'WORKING' | 'READY' | 'FAILED';

/** next.type */
export type NextQuestionType = 'FOLLOW_UP' | 'ROOT' | 'NONE';

/** Polling/Timeout 공통 next 객체 타입 */
export interface IRecordingResultNext {
  type: NextQuestionType;
  nextQuestionId: number | null;
  nextQuestionText: string | null;
  rootId: number | null;
  rootText: string | null;
  rootIndex: number | null;
}

/** Polling API 응답 타입 (GET /api/recordings/{recordingId}/results) */
export interface IRecordingResultResponse {
  sessionId: number;
  status: RecordingResultStatus;
  next: IRecordingResultNext | null;
}

/** Polling API - 한 번 조회 */
export const getRecordingResult = async (
  recordingId: number,
): Promise<IRecordingResultResponse> => {
  const response = await apiClient.get(`/api/recordings/${recordingId}/results`);
  return unwrapResult<IRecordingResultResponse>(response.data);
};

/** next 객체 → 프론트에서 쓰는 IQuestion 로 매핑 */
const mapNextToQuestion = (next: IRecordingResultNext | null): IQuestion | null => {
  if (!next || next.type === 'NONE' || next.nextQuestionId == null) {
    return null;
  }

  const isFollowUp = next.type === 'FOLLOW_UP';

  return {
    questionId: String(next.nextQuestionId),
    mainQuestion: isFollowUp
      ? next.rootText ?? ''           // 꼬리질문이면 rootText를 메인 질문으로
      : next.nextQuestionText ?? '',  // 루트 질문이면 그대로
    subQuestion: isFollowUp
      ? next.nextQuestionText ?? ''   // 꼬리질문 텍스트
      : '',
    order: next.rootIndex ?? 0,
  };
};

/** Polling 헬퍼: READY/FAILED 될 때까지 반복 조회 */
export const pollRecordingResult = async (
  recordingId: number,
  maxAttempts: number = 60,
  intervalMs: number = 3000,
): Promise<IRecordingResultResponse> => {
  let attempts = 0;

  while (attempts < maxAttempts) {
    const result = await getRecordingResult(recordingId);

    if (result.status === 'READY' || result.status === 'FAILED') {
      return result;
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
    attempts += 1;
  }

  throw new Error('Polling timeout - 녹음 처리 대기 시간이 너무 깁니다.');
};

// =====================================================
// 5. 녹음 파일 업로드 & 다음 질문 받기 전체 플로우
// =====================================================

/**
 * 녹음 파일 업로드 + recording 저장 + polling 후
 * 다음 질문(IQuestion) 혹은 null(세션 종료) 반환
 */
export const uploadRecordingAndGetNext = async (
  questionId: string | number,
  audioBlob: Blob,
): Promise<IQuestion | null> => {
  const numericQuestionId =
    typeof questionId === 'string' ? Number(questionId) : questionId;

  if (Number.isNaN(numericQuestionId)) {
    throw new Error('유효하지 않은 questionId 입니다.');
  }

  const contentType = (audioBlob as any).type || 'audio/webm';

  // 1) Presign 발급
  const { uploadUrl, requiredHeaders } = await getRecordingPresignUrl(
    numericQuestionId,
    contentType,
  );

  // 2) S3 업로드
  await uploadToS3(uploadUrl, audioBlob, requiredHeaders);

  // 3) 녹음 저장 요청 (비동기 작업 트리거)
  const { recordingId } = await saveRecording(numericQuestionId);

  // 4) Polling 으로 꼬리질문/다음 루트질문 생성 완료까지 대기
  const result = await pollRecordingResult(recordingId);

  if (result.status === 'FAILED') {
    throw new Error('녹음 처리 중 오류가 발생했습니다.');
  }

  // 5) next 객체 → IQuestion 으로 변환 (없으면 null)
  return mapNextToQuestion(result.next);
};

// =====================================================
// 6. 시간초과 시 Timeout API
// =====================================================

/** Timeout API 응답 (status는 항상 READY) */
export interface ITimeoutResponse {
  sessionId: number;
  status: 'READY';
  next: IRecordingResultNext | null;
}

/** 사용자가 시간초과로 답변하지 못한 경우 - Timeout API 호출 */
export const sendTimeout = async (
  questionId: string | number,
): Promise<ITimeoutResponse> => {
  const response = await apiClient.post(`/api/questions/${questionId}/timeout`);
  return unwrapResult<ITimeoutResponse>(response.data);
};

/**
 * Timeout 처리 후 바로 다음 질문(IQuestion) 혹은 null(세션 종료) 반환하는 헬퍼
 * - next.type === ROOT → 다음 루트 질문
 * - next.type === NONE → 더 이상 질문 없음 (최종 피드백 조회)
 */
export const timeoutAndGetNextQuestion = async (
  questionId: string | number,
): Promise<IQuestion | null> => {
  const result = await sendTimeout(questionId);

  if (!result.next || result.next.type === 'NONE') {
    return null;
  }

  return mapNextToQuestion(result.next);
};

// =====================================================
// 7. 최종 피드백 조회 API
// =====================================================

/** 피드백 생성 진행 상태 */
export type FeedbackProgressStatus = 'WORKING' | 'READY' | 'FAILED';

/** QnA 턴 타입 */
export type FeedbackTurnType = 'QUESTION' | 'ANSWER';

/** 한 턴 (질문 / 답변) */
export interface IQnaTurn {
  turn: FeedbackTurnType;
  content: string;
}

/** 한 루트 질문에 대한 요약 정보 */
export interface IQuestionSummary {
  questionNumber: number;
  rootQuestion: string;
  aiFeedback: string | null;
  selfFeedback: string | null;
  qnaTurns: IQnaTurn[];
}

/** 인터뷰 전체 요약 */
export interface IInterviewSummary {
  interviewTitle: string;
  timeoutQuestionNumber: number;
  questionSummaries: IQuestionSummary[];
}

/** 최종 피드백 조회 응답 */
export interface IFinalFeedbackResponse {
  feedbackProgressStatus: FeedbackProgressStatus;
  interviewSummary: IInterviewSummary | null; // WORKING일 때는 null
}

/** 최종 피드백 조회 (GET /api/interview-sessions/{sessionId}) */
export const getFinalFeedback = async (
  sessionId: string | number,
): Promise<IFinalFeedbackResponse> => {
  const response = await apiClient.get(`/api/interview-sessions/${sessionId}`);
  return unwrapResult<IFinalFeedbackResponse>(response.data);
};
