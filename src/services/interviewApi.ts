import apiClient from './api';

// ==================== 타입 정의 ====================

/** 자소서 업로드용 Presigned URL 응답 (POST /api/presign/resume) */
export interface IResumePresignResponse {
  uploadUrl: string;
  key: string;
  requiredHeaders: { [header: string]: string };
}

/** 녹음 업로드용 Presigned URL 요청 (POST /api/presign/recording) */
export interface IRecordingPresignRequest {
  questionId: number;
  contentType: string;
}

/** 녹음 업로드용 Presigned URL 응답 (POST /api/presign/recording) */
export interface IRecordingPresignResponse {
  uploadUrl: string;
  key: string;
  requiredHeaders: { [header: string]: string };
}

/** 면접 모드(NORMAL / HARD) */
export type InterviewMode = 'NORMAL' | 'HARD';

/** FE에서 면접 세션 생성 시 사용하는 요청 파라미터 */
export interface ICreateInterviewSessionRequest {
  /** presign-resume 응답의 key 전체 값 (예: "resume/123/xxx.docx") */
  resumeKey: string;
  /** 직무명 */
  jobTitle: string;
  /** normal: 일반, pressure: 압박면접 */
  interviewType: 'normal' | 'pressure';
}

/** 실제 BE로 보내는 payload */
interface ICreateInterviewSessionPayload {
  mode: InterviewMode;
  jobRole: string;
  resumeId: string;
}

/** 질문 정보 (FE에서 사용하는 형태) */
export interface IQuestion {
  /** BE questionId */
  questionId: string;
  /** 화면에 보여줄 메인 질문 (루트 질문 or 루트 질문 텍스트) */
  mainQuestion: string;
  /** 꼬리질문이 있을 때 서브 질문 텍스트 */
  subQuestion: string;
  /** 해당 루트 질문이 세션에서 몇 번째인지 (1 ~ n) */
  order: number;
}

/** 면접 세션 생성 응답 (FE 전용) */
export interface ICreateInterviewSessionResponse {
  sessionId: number;
  firstQuestion: IQuestion;
}

/** 녹음 저장 enqueue 상태 */
export type RecordingEnqueueStatus = 'UPLOADED';

/** 녹음 저장 응답 (POST /api/questions/{questionId}/recordings) */
export interface ISaveRecordingResponse {
  recordingId: number;
  status: RecordingEnqueueStatus;
}

/** 꼬리질문 생성 상태 (GET /api/recordings/{recordingId}/results) */
export type RecordingResultStatus = 'WORKING' | 'READY' | 'FAILED';

/** next.type */
export type NextQuestionType = 'FOLLOW_UP' | 'ROOT' | 'NONE';

/** Polling API 의 next 객체 */
export interface IRecordingResultNext {
  type: NextQuestionType;
  nextQuestionId: number | null;
  nextQuestionText: string | null;
  rootId: number | null;
  rootText: string | null;
  rootIndex: number | null;
}

/** 녹음 처리 결과 (Polling 응답 result) */
export interface IRecordingResultResponse {
  sessionId: number;
  status: RecordingResultStatus;
  next: IRecordingResultNext | null;
}

/** 피드백 한 항목 (최종 피드백용 – BE 스펙에 맞게 추후 조정 가능) */
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
export const getResumePresignUrl = async (
  fileName: string,
): Promise<IResumePresignResponse> => {
  const response = await apiClient.post<IResumePresignResponse>(
    '/api/presign/resume',
    null, // body 없음
    {
      params: { fileName }, // RequestParam 로 전달
    },
  );
  return response.data;
};

/** 2. 녹음 업로드용 프리사인 URL 발급 (POST /api/presign/recording) */
export const getRecordingPresignUrl = async (
  questionId: number,
  contentType: string,
): Promise<IRecordingPresignResponse> => {
  const payload: IRecordingPresignRequest = { questionId, contentType };
  const response = await apiClient.post<IRecordingPresignResponse>(
    '/api/presign/recording',
    payload,
  );
  return response.data;
};

/** 3. S3에 파일 업로드 (프리사인 URL 사용) */
export const uploadToS3 = async (
  uploadUrl: string,
  file: Blob,
  requiredHeaders: Record<string, string> = {},
): Promise<void> => {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: requiredHeaders,
  });
  if (!res.ok) {
    throw new Error(`S3 업로드 실패: ${res.status}`);
  }
};

/** S3 key에서 resumeId 추출 */
export const extractResumeId = (resumeKey: string): string => {
  const parts = resumeKey.split('/');
  const fileName = parts[parts.length - 1];
  const nameWithoutExt = fileName.split('.').slice(0, -1).join('.');
  return nameWithoutExt;
};

/** BE 응답 원본 타입 (firstQuestionId / firstQuestionText) */
interface ICreateInterviewSessionApiResponse {
  sessionId: number;
  firstQuestionId: number;
  firstQuestionText: string;
}

/** 4. 자소서 기반 질문 생성 및 첫번째 질문 조회 */
export const createInterviewSession = async (
  params: ICreateInterviewSessionRequest,
): Promise<ICreateInterviewSessionResponse> => {
  const { resumeKey, jobTitle, interviewType } = params;

  const payload: ICreateInterviewSessionPayload = {
    mode: interviewType === 'pressure' ? 'HARD' : 'NORMAL',
    jobRole: jobTitle,
    resumeId: extractResumeId(resumeKey),
  };

  const response = await apiClient.post<ICreateInterviewSessionApiResponse>(
    '/api/interview-sessions',
    payload,
  );

  const data = response.data;

  const firstQuestion: IQuestion = {
    questionId: String(data.firstQuestionId),
    mainQuestion: data.firstQuestionText,
    subQuestion: '',
    order: 1,
  };

  return {
    sessionId: data.sessionId,
    firstQuestion,
  };
};

/** 5. recording 저장 및 꼬리질문 생성 트리거 (비동기) */
export const saveRecording = async (
  questionId: number | string,
): Promise<ISaveRecordingResponse> => {
  const response = await apiClient.post<ISaveRecordingResponse>(
    `/api/questions/${questionId}/recordings`,
    null, // body 없음
  );
  return response.data;
};

/** 6. recording 저장 및 꼬리질문 생성 상태 Polling (1회 조회) */
export const getRecordingResult = async (
  recordingId: number,
): Promise<IRecordingResultResponse> => {
  const response = await apiClient.get<IRecordingResultResponse>(
    `/api/recordings/${recordingId}/results`,
  );
  return response.data;
};

/** 7. Polling 헬퍼 함수 (자동으로 상태 확인) */
export const pollRecordingResult = async (
  recordingId: number,
  maxAttempts: number = 60,
  interval: number = 5000,
): Promise<IRecordingResultResponse> => {
  let attempts = 0;
  while (attempts < maxAttempts) {
    const result = await getRecordingResult(recordingId);
    if (result.status === 'READY' || result.status === 'FAILED') {
      return result;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
    attempts += 1;
  }
  throw new Error('Polling timeout - 처리 시간이 너무 오래 걸립니다.');
};

/** 8. 사용자가 시간초과로 답변하지 못한 경우 */
export const sendTimeout = async (questionId: string): Promise<void> => {
  await apiClient.post(`/api/questions/${questionId}/timeout`);
};

/** 9. 최종 피드백 조회 */
export const getFinalFeedback = async (
  sessionId: string,
): Promise<IFinalFeedbackResponse> => {
  const response = await apiClient.get<IFinalFeedbackResponse>(
    `/api/interview-sessions/${sessionId}`,
  );
  return response.data;
};

// ==================== 전체 플로우 헬퍼 함수 ====================

/** 자소서 업로드 전체 플로우: key (objectKey) 반환 */
export const uploadResume = async (file: File): Promise<string> => {
  try {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !['pdf', 'docx'].includes(extension)) {
      throw new Error('PDF 또는 DOCX 파일만 업로드 가능합니다.');
    }

    const { uploadUrl, key, requiredHeaders } =
      await getResumePresignUrl(file.name);

    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { ...requiredHeaders },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error(`S3 업로드 실패: ${uploadResponse.status}`);
    }

    return key;
  } catch (error) {
    console.error('❌ 자소서 업로드 실패:', error);
    throw error;
  }
};

/**
 * 녹음 파일 업로드 + 저장 + 다음 질문까지 한 번에 처리
 * - return: 다음에 보여줄 질문(IQuestion) 이 없으면 null (세션 종료)
 */
export const uploadRecordingAndGetNext = async (
  questionId: string,
  audioBlob: Blob,
): Promise<IQuestion | null> => {
  const numericQuestionId = Number(questionId);
  if (Number.isNaN(numericQuestionId)) {
    throw new Error('잘못된 questionId 입니다.');
  }

  const contentType =
    (audioBlob as any).type || 'audio/webm';

  // 1) presign url 발급
  const { uploadUrl, requiredHeaders } =
    await getRecordingPresignUrl(numericQuestionId, contentType);

  // 2) S3 업로드
  await uploadToS3(uploadUrl, audioBlob, requiredHeaders);

  // 3) 녹음 저장
  const { recordingId } = await saveRecording(numericQuestionId);

  // 4) Polling 으로 다음 질문 조회
  const result = await pollRecordingResult(recordingId);

  if (result.status === 'FAILED') {
    throw new Error('녹음 처리에 실패했습니다.');
  }

  const next = result.next;
  if (!next || next.type === 'NONE') {
    // 더 이상 보여줄 질문이 없으면 세션 종료. 이후 최종 피드백 조회
    return null;
  }

  const isFollowUp = next.type === 'FOLLOW_UP';

  const mapped: IQuestion = {
    questionId: String(next.nextQuestionId ?? ''),
    mainQuestion: isFollowUp
      ? next.rootText ?? ''
      : next.nextQuestionText ?? '',
    subQuestion: isFollowUp ? next.nextQuestionText ?? '' : '',
    order: next.rootIndex ?? 0,
  };

  return mapped;
};
