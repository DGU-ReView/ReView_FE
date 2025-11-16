import apiClient from './api';

// result만 뽑아주는 헬퍼
const unwrapResult = <T>(data: any): T => {
  if (data && typeof data === 'object' && 'result' in data) {
    return data.result as T;
  }
  return data as T;
};

// ==================== 타입 정의 ====================

// 1) SSE 알림 payload (팝업 알림용) — 팝업 알림을 위한 SSE 구독용 API
export interface IRandomNotificationPayload {
  jobName: string;        // 직무 이름
  interviewName: string;  // 인터뷰 제목
  questionNumber: number; // 해당 인터뷰의 몇 번째 질문인지
  peerFeedbackId: number; // = peerAnswerId (랜덤 질문 조회에 사용)
}

// 2) 랜덤 팝업 질문 조회 응답 — 랜덤 팝업 질문 조회 API
export interface IRandomQuestionContext {
  questionId: number;
  questionText: string;
  presignedRecordingGetUrl: string;
  sttText: string;
}

export interface IRandomQuestion {
  question: {
    questionId: number;
    questionText: string;
  };
  context: IRandomQuestionContext;
}

// 3) presign 응답 — 랜덤 팝업 질문 - 녹음 업로드용 프리사인 URL 발급
export interface IPresignUrlResponse {
  uploadUrl: string;                     // S3 PUT presigned URL
  key: string;                           // 업로드될 S3 오브젝트 경로
  requiredHeaders: Record<string, string>; // PUT 시 함께 보내야 할 헤더들
}

// recordingKey 요청용 타입은 더 이상 사용 안 하지만, 남겨둠 (호환용)
export interface IRandomQuestionRecordingRequest {
  recordingKey: string;
}

// 4) 녹음 저장 응답 — 랜덤 질문에 대한 recording 저장 및 피드백 생성 API (비동기)
export interface IFeedbackRecordingResponse {
  recordingId: number;
  status: 'UPLOADED'; // 비동기 작업이 큐에 올라갔다는 뜻
}

// 5) 피드백 조회 응답 — 랜덤 질문에 대한 피드백 확인 API (polling)
export type FeedbackProgressStatus = 'WORKING' | 'READY' | 'FAILED';

export interface IFeedbackResult {
  questionId: number;
  questionText: string;
  aiFeedback: string;
  selfFeedback: string;
  presignedRecordingGetUrl: string;
  sttText: string;
}

export interface IFeedbackResultResponse {
  progressStatus: FeedbackProgressStatus;
  result: IFeedbackResult | null; // WORKING/FAILED일 때는 null
}

// ==================== API 함수들 ====================

/**
 * 1. 랜덤 팝업 질문 조회
 *    GET /api/random-questions/peer/{peerAnswerId}
 *    peerAnswerId = SSE 알림의 peerFeedbackId
 */
export const getRandomQuestion = async (
  peerAnswerId: number | string,
): Promise<IRandomQuestion> => {
  const response = await apiClient.get(`/api/random-questions/peer/${peerAnswerId}`);
  return unwrapResult<IRandomQuestion>(response.data);
};

/**
 * 2. 랜덤 팝업 질문 - 녹음 업로드용 프리사인 URL 발급
 *    POST /api/presign/recording/feedback-question
 *    Body: { questionId: Long, contentType: String }
 */
export const getFeedbackRecordingPresignUrl = async (
  questionId: number,
  contentType: string,
): Promise<IPresignUrlResponse> => {
  const response = await apiClient.post('/api/presign/recording/feedback-question', {
    questionId,
    contentType,
  });
  return unwrapResult<IPresignUrlResponse>(response.data);
};

/**
 * 3. S3에 파일 업로드 (프리사인 URL 사용)
 */
export const uploadToS3 = async (
  presignedUrl: string,
  file: Blob,
  extraHeaders: Record<string, string> = {},
): Promise<void> => {
  await fetch(presignedUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type || 'audio/webm',
      ...extraHeaders,
    },
  });
};

/**
 * 4. 랜덤 질문에 대한 recording 저장 및 피드백 생성 (비동기)
 *    POST /api/random-questions/peer/questions/{questionId}
 *    Body 없음, path param으로 questionId만 넘김
 */
export const saveFeedbackRecording = async (
  questionId: number,
): Promise<IFeedbackRecordingResponse> => {
  const response = await apiClient.post(
    `/api/random-questions/peer/questions/${questionId}`,
  );
  return unwrapResult<IFeedbackRecordingResponse>(response.data);
};

/**
 * 5. 랜덤 질문에 대한 피드백 확인 (polling)
 *    GET /api/random-questions/peer/recordings/{recordingId}/feedbacks
 */
export const getFeedbackResult = async (
  recordingId: number,
): Promise<IFeedbackResultResponse> => {
  const response = await apiClient.get(
    `/api/random-questions/peer/recordings/${recordingId}/feedbacks`,
  );
  return unwrapResult<IFeedbackResultResponse>(response.data);
};

/**
 * 6. Polling 헬퍼 함수
 *    progressStatus 가 READY / FAILED 가 될 때까지 조회
 */
export const pollFeedbackResult = async (
  recordingId: number,
  maxAttempts: number = 60,
  interval: number = 5000,
): Promise<IFeedbackResultResponse> => {
  let attempts = 0;

  while (attempts < maxAttempts) {
    const result = await getFeedbackResult(recordingId);

    if (result.progressStatus === 'READY' || result.progressStatus === 'FAILED') {
      return result;
    }

    await new Promise((resolve) => setTimeout(resolve, interval));
    attempts++;
  }

  throw new Error('Polling timeout - 피드백 생성 시간이 너무 오래 걸립니다.');
};

/**
 * 7. SSE 구독 (Server-Sent Events)
 *    GET /api/subscribe
 */
export const subscribeToNotifications = (
  onMessage: (event: MessageEvent) => void,
  onError?: (error: Event) => void,
): EventSource => {
  const baseURL = apiClient.defaults.baseURL ?? '';
  const eventSource = new EventSource(`${baseURL}/api/subscribe`);

  eventSource.onmessage = onMessage;

  if (onError) {
    eventSource.onerror = onError;
  }

  return eventSource;
};

// ==================== 전체 플로우 헬퍼 함수 ====================

/**
 * 랜덤 질문 녹음 업로드 및 피드백 받기 전체 플로우
 *
 * 1) 프리사인 URL 발급
 * 2) S3 업로드
 * 3) recording 저장 (비동기 큐에 올리기)
 * 4) 피드백 READY 될 때까지 polling
 * 5) IFeedbackResult 리턴 (aiFeedback, selfFeedback 등 포함)
 */
export const uploadFeedbackRecordingAndGetResult = async (
  questionId: number,
  audioBlob: Blob,
): Promise<IFeedbackResult> => {
  // 1. 프리사인 URL 받기
  const contentType = audioBlob.type || 'audio/webm';
  const { uploadUrl, requiredHeaders } = await getFeedbackRecordingPresignUrl(
    questionId,
    contentType,
  );

  // 2. S3에 업로드
  await uploadToS3(uploadUrl, audioBlob, requiredHeaders);

  // 3. 녹음 저장 & 비동기 피드백 생성 트리거
  const { recordingId, status } = await saveFeedbackRecording(questionId);

  if (status !== 'UPLOADED') {
    throw new Error(`예상치 못한 recording 상태입니다: ${status}`);
  }

  // 4. 피드백 생성 상태 polling
  const result = await pollFeedbackResult(recordingId);

  if (result.progressStatus === 'FAILED' || !result.result) {
    throw new Error('피드백 생성에 실패했습니다.');
  }

  // 5. 최종 피드백 결과 리턴
  return result.result;
};
