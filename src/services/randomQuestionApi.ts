import apiClient from './api';

// ==================== 타입 정의 ====================

export interface RandomQuestion {
  questionId: string;
  question: string;
  peerAnswerId: string;
}

export interface RandomQuestionRecordingRequest {
  recordingKey: string;
}

export interface FeedbackRecordingResponse {
  recordingId: string;
  status: 'processing' | 'completed' | 'failed';
}

export interface FeedbackResultResponse {
  status: 'processing' | 'completed' | 'failed';
  feedback?: string;
}

export interface PresignUrlResponse {
  presignedUrl: string;
  fileKey: string;
}

// ==================== API 함수들 ====================

/**
 * 1. 랜덤 팝업 질문 조회
 */
export const getRandomQuestion = async (peerAnswerId: string): Promise<RandomQuestion> => {
  const response = await apiClient.get(`/api/random-questions/peer/${peerAnswerId}`);
  return response.data;
};

/**
 * 2. 랜덤 팝업 질문 - 녹음 업로드용 프리사인 URL 발급
 */
export const getFeedbackRecordingPresignUrl = async (fileName: string): Promise<PresignUrlResponse> => {
  const response = await apiClient.post('/api/presign/recording/feedback-question', { fileName });
  return response.data;
};

/**
 * 3. S3에 파일 업로드
 */
export const uploadToS3 = async (presignedUrl: string, file: Blob): Promise<void> => {
  await fetch(presignedUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type || 'audio/webm',
    },
  });
};

/**
 * 4. 랜덤 질문에 대한 recording 저장 및 피드백 생성 (비동기)
 */
export const saveFeedbackRecording = async (
  questionId: string,
  data: RandomQuestionRecordingRequest
): Promise<FeedbackRecordingResponse> => {
  const response = await apiClient.get(`/api/random-questions/peer/questions/${questionId}`, {
    params: data,
  });
  return response.data;
};

/**
 * 5. 랜덤 질문에 대한 피드백 확인 (polling)
 */
export const getFeedbackResult = async (recordingId: string): Promise<FeedbackResultResponse> => {
  const response = await apiClient.get(`/api/random-questions/peer/recordings/${recordingId}/feedbacks`);
  return response.data;
};

/**
 * 6. Polling 헬퍼 함수
 */
export const pollFeedbackResult = async (
  recordingId: string,
  maxAttempts: number = 60,
  interval: number = 5000
): Promise<FeedbackResultResponse> => {
  let attempts = 0;

  while (attempts < maxAttempts) {
    const result = await getFeedbackResult(recordingId);

    if (result.status === 'completed' || result.status === 'failed') {
      return result;
    }

    await new Promise((resolve) => setTimeout(resolve, interval));
    attempts++;
  }

  throw new Error('Polling timeout - 피드백 생성 시간이 너무 오래 걸립니다.');
};

/**
 * 7. SSE 구독 (Server-Sent Events)
 */
export const subscribeToNotifications = (
  onMessage: (event: MessageEvent) => void,
  onError?: (error: Event) => void
): EventSource => {
  const eventSource = new EventSource(`${apiClient.defaults.baseURL}/api/subscribe`);

  eventSource.onmessage = onMessage;

  if (onError) {
    eventSource.onerror = onError;
  }

  return eventSource;
};

// ==================== 전체 플로우 헬퍼 함수 ====================

/**
 * 랜덤 질문 녹음 업로드 및 피드백 받기 전체 플로우
 */
export const uploadFeedbackRecordingAndGetResult = async (
  questionId: string,
  audioBlob: Blob
): Promise<string> => {
  // 1. 프리사인 URL 받기
  const fileName = `feedback-${questionId}-${Date.now()}.webm`;
  const { presignedUrl, fileKey } = await getFeedbackRecordingPresignUrl(fileName);

  // 2. S3에 업로드
  await uploadToS3(presignedUrl, audioBlob);

  // 3. 피드백 생성 시작
  const { recordingId, status } = await saveFeedbackRecording(questionId, {
    recordingKey: fileKey,
  });

  // 4. 즉시 완료된 경우
  if (status === 'completed') {
    const result = await getFeedbackResult(recordingId);
    return result.feedback || '피드백을 받지 못했습니다.';
  }

  // 5. 처리 중이면 polling
  const result = await pollFeedbackResult(recordingId);

  if (result.status === 'failed') {
    throw new Error('피드백 생성에 실패했습니다.');
  }

  return result.feedback || '피드백을 받지 못했습니다.';
};
