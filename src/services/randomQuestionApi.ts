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

const joinUrl = (base = '', path = '') =>
  `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;

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

// (호환용, 현재 미사용)
export interface IRandomQuestionRecordingRequest {
  recordingKey: string;
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
): Promise<IRandomQuestion> => {
  const resp = await apiClient.get(`/api/random-questions/peer/${peerAnswerId}`);
  return unwrapResult<IRandomQuestion>(resp.data);
};

/** 2. 녹음 업로드용 프리사인 URL (POST /api/presign/recording/feedback-question) */
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

/** 3. S3 업로드 (PUT presigned URL) */
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

/** 4. 녹음 저장 & 피드백 생성 트리거 (POST /api/random-questions/peer/questions/{questionId}) */
export const saveFeedbackRecording = async (
  questionId: number,
): Promise<IFeedbackRecordingResponse> => {
  const resp = await apiClient.post(`/api/random-questions/peer/questions/${questionId}`);
  return unwrapResult<IFeedbackRecordingResponse>(resp.data);
};

/** 5. 피드백 조회 (GET /api/random-questions/peer/recordings/{recordingId}/feedbacks) */
export const getFeedbackResult = async (
  recordingId: number,
): Promise<IFeedbackResultResponse> => {
  const resp = await apiClient.get(
    `/api/random-questions/peer/recordings/${recordingId}/feedbacks`,
  );
  return unwrapResult<IFeedbackResultResponse>(resp.data);
};

/** 6. Polling 헬퍼 (READY/FAILED 될 때까지) */
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

// ---------------------- SSE 구독 ----------------------

/**
 * 7. SSE 구독
 *   - 기본 경로: /api/subscribe (env 로 오버라이드 가능: VITE_SSE_PATH)
 *   - Authorization 필요 시 헤더와 쿼리 모두 지원
 */
export const subscribeToNotifications = (
  onMessage: (event: MessageEvent<string>) => void,
  onError?: (error: unknown) => void,
): EventSource => {
  const base = apiClient.defaults.baseURL ?? ''; // 예: '/api'
  const ssePath = import.meta.env.VITE_SSE_PATH ?? '/api/subscribe';
  const url = joinUrl(base, ssePath);

  const token = localStorage.getItem('accessToken') ?? '';

  // 헤더가 필요한 경우 폴리필 사용 (쿼리 파라미터로도 함께 전달)
  const es = new EventSourcePolyfill(
    token ? `${url}?token=${encodeURIComponent(token)}` : url,
    {
      withCredentials: true,
      heartbeatTimeout: 120_000, // 서버 keep-alive 가 뜸해도 버퍼링 여유
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    },
  ) as EventSource;

  es.onmessage = onMessage as any;
  if (onError) es.onerror = onError as any;

  return es; // 호출부에서 .close()로 정리
};

// ---------------------- 전체 플로우 ----------------------

/**
 * 8. 업로드 → 저장 트리거 → Polling → 최종 피드백 반환
 */
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
