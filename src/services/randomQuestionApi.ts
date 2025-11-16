// src/services/randomQuestionApi.ts
import apiClient from './api';
import { EventSourcePolyfill } from 'event-source-polyfill';

// ---------------------- 공통 유틸 ----------------------
const unwrapResult = <T>(data: any): T => {
  if (data && typeof data === 'object' && 'result' in data) {
    return (data as { result: T }).result;
  }
  return data as T;
};

// ---------------------- 타입 정의 ----------------------

// 1) SSE 알림 payload
export interface IRandomNotificationPayload {
  jobName: string;
  interviewName: string;
  questionNumber: number;
  peerFeedbackId: number; // = peerAnswerId
}

// 2) 랜덤 팝업 질문 조회 응답
export interface IRandomQuestionContext {
  questionId: number;
  questionText: string;
  presignedRecordingGetUrl: string;
  sttText: string;
}
export interface IRandomQuestion {
  question: { questionId: number; questionText: string };
  context: IRandomQuestionContext;
}

// 3) presign 응답
export interface IPresignUrlResponse {
  uploadUrl: string;
  key: string;
  requiredHeaders: Record<string, string>;
}

// 4) 녹음 저장 응답
export interface IFeedbackRecordingResponse {
  recordingId: number;
  status: 'UPLOADED';
}

// 5) 피드백 조회 응답
export type TFeedbackProgressStatus = 'WORKING' | 'READY' | 'FAILED';
export interface IFeedbackResult {
  questionId: number;
  questionText: string;
  aiFeedback: string;
  selfFeedback: string;
  presignedRecordingGetUrl: string;
  sttText: string;
}
export interface IFeedbackResultResponse {
  progressStatus: TFeedbackProgressStatus;
  result: IFeedbackResult | null;
}

// ---------------------- API 함수들 ----------------------

/** 1. 랜덤 팝업 질문 조회 (GET /api/random-questions/peer/{peerAnswerId}) */
export const getRandomQuestion = async (
  peerAnswerId: number | string,
  opts?: { noCache?: boolean; signal?: AbortSignal },
): Promise<IRandomQuestion> => {
  const params = opts?.noCache ? { _ts: Date.now() } : undefined;

  // 디버깅 참고 로그
  // eslint-disable-next-line no-console
  console.log('[RQ] GET /api/random-questions/peer/:id', { peerAnswerId, params });

  const resp = await apiClient.get(`/api/random-questions/peer/${peerAnswerId}`, {
    params,
    signal: opts?.signal as any,
    headers: opts?.noCache
      ? { 'Cache-Control': 'no-cache', Pragma: 'no-cache' }
      : undefined,
  });
  return unwrapResult<IRandomQuestion>(resp.data);
};

/** 2. 녹음 업로드용 프리사인 URL */
export const getFeedbackRecordingPresignUrl = async (
  questionId: number,
  contentType: string,
): Promise<IPresignUrlResponse> => {
  const resp = await apiClient.post('/api/presign/recording/feedback-question', {
    questionId,
    contentType,
  });
  return unwrapResult<IPresignUrlResponse>(resp.data);
};

/** 3. S3 업로드 */
export const uploadToS3 = async (
  presignedUrl: string,
  file: Blob,
  extraHeaders: Record<string, string> = {},
): Promise<void> => {
  const r = await fetch(presignedUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': (file as any).type || 'audio/webm',
      ...extraHeaders,
    },
  });
  if (!r.ok) throw new Error(`S3 업로드 실패: ${r.status}`);
};

/** 4. 녹음 저장 & 피드백 생성 트리거 */
export const saveFeedbackRecording = async (
  questionId: number,
): Promise<IFeedbackRecordingResponse> => {
  const resp = await apiClient.post(`/api/random-questions/peer/questions/${questionId}`);
  return unwrapResult<IFeedbackRecordingResponse>(resp.data);
};

/** 5. 피드백 조회 */
export const getFeedbackResult = async (
  recordingId: number,
): Promise<IFeedbackResultResponse> => {
  const resp = await apiClient.get(
    `/api/randomquestions/peer/recordings/${recordingId}/feedbacks`,
  );
  return unwrapResult<IFeedbackResultResponse>(resp.data);
};

/** 6. Polling 헬퍼 */
export const pollFeedbackResult = async (
  recordingId: number,
  maxAttempts = 60,
  intervalMs = 5000,
): Promise<IFeedbackResultResponse> => {
  let attempts = 0;
  while (attempts < maxAttempts) {
    const result = await getFeedbackResult(recordingId);
    if (result.progressStatus === 'READY' || result.progressStatus === 'FAILED') {
      return result;
    }
    await new Promise((res) => setTimeout(res, intervalMs));
    attempts += 1;
  }
  throw new Error('Polling timeout - 피드백 생성 시간이 너무 오래 걸립니다.');
};

/**
 * 7. SSE 구독
 */
export const subscribeToNotifications = (
  onMessage: (event: MessageEvent) => void,
  onError?: (error: Event) => void,
): EventSource => {
  const baseURL = apiClient.defaults.baseURL ?? '';
  const eventSource = new EventSourcePolyfill(`${baseURL}/api/subscribe`, {
    withCredentials: true,
    heartbeatTimeout: 300000, // 5분
  }) as EventSource;

  eventSource.onmessage = onMessage;

  if (onError) {
    eventSource.onerror = onError;
  }

  return eventSource;
};

// ---------------------- 업로드 → 피드백 전체 플로우 ----------------------

export const uploadFeedbackRecordingAndGetResult = async (
  questionId: number,
  audioBlob: Blob,
): Promise<IFeedbackResult> => {
  const contentType = (audioBlob as any).type || 'audio/webm';
  const { uploadUrl, requiredHeaders } = await getFeedbackRecordingPresignUrl(
    questionId,
    contentType,
  );
  await uploadToS3(uploadUrl, audioBlob, requiredHeaders);

  const { recordingId, status } = await saveFeedbackRecording(questionId);
  if (status !== 'UPLOADED') throw new Error(`예상치 못한 recording 상태: ${status}`);

  const polled = await pollFeedbackResult(recordingId);
  if (polled.progressStatus !== 'READY' || !polled.result) {
    throw new Error('피드백 생성에 실패했습니다.');
  }
  return polled.result;
};
