import { apiClient } from './api';

// ==================== 타입 정의 ====================

/**
 * 자소서 업로드용 Presigned URL 응답
 */
export interface ResumePresignResponse {
  uploadUrl: string;
  key: string;
  requiredHeaders: {
    'Content-Type': string;
  };
}

/**
 * 녹음 업로드용 Presigned URL 요청
 */
export interface RecordingPresignRequest {
  questionId: number;
  contentType: string; // 'audio/webm', 'audio/mpeg', etc.
}

/**
 * 녹음 업로드용 Presigned URL 응답
 */
export interface RecordingPresignResponse {
  uploadUrl: string;
  key: string;
  requiredHeaders: {
    [key: string]: string;
  };
}

/**
 * 면접 세션 생성 요청
 */
export interface CreateInterviewSessionRequest {
  mode: 'NORMAL' | 'HARD'; // HARD = 압박면접
  jobRole: string;
  resumeId: string; // S3 key에서 추출한 ID
}

/**
 * 면접 세션 생성 응답
 */
export interface CreateInterviewSessionResponse {
  sessionId: number;
  firstQuestionId: number;
  firstQuestionText: string;
}

/**
 * 녹음 저장 응답 (비동기)
 */
export interface SaveRecordingResponse {
  recordingId: number;
  status: 'UPLOADED'; // 비동기 작업 큐에 등록됨
}

/**
 * 다음 질문 객체
 */
export interface NextQuestion {
  type: 'FOLLOW_UP' | 'ROOT' | 'NONE';
  nextQuestionId: number | null;
  nextQuestionText: string | null;
  rootId: number;
  rootText: string;
  rootIndex: number;
}

/**
 * Polling 결과 응답
 */
export interface PollingResultResponse {
  sessionId: number;
  status: 'WORKING' | 'READY' | 'FAILED';
  next: NextQuestion | null;
}

/**
 * Timeout 처리 응답
 */
export interface TimeoutResponse {
  sessionId: number;
  status: 'READY';
  next: NextQuestion | null;
}

/**
 * Q&A 턴
 */
export interface QnATurn {
  turn: 'QUESTION' | 'ANSWER';
  content: string;
}

/**
 * 질문 요약
 */
export interface QuestionSummary {
  questionNumber: number;
  rootQuestion: string;
  aiFeedback: string | null;
  selfFeedback: string | null;
  qnaTurns: QnATurn[];
}

/**
 * 면접 요약
 */
export interface InterviewSummary {
  interviewTitle: string;
  timeoutQuestionNumber: number;
  questionSummaries: QuestionSummary[];
}

/**
 * 최종 피드백 응답
 */
export interface FinalFeedbackResponse {
  feedbackProgressStatus: 'WORKING' | 'READY' | 'FAILED';
  interviewSummary: InterviewSummary | null;
}

// ==================== API 함수들 ====================

/**
 * 1. 자소서 업로드 (전체 플로우)
 * - Presigned URL 받기 (RequestParam 방식)
 * - S3에 직접 업로드
 */
export const uploadResume = async (file: File): Promise<string> => {
  try {
    // 파일명 유효성 검사
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !['pdf', 'docx'].includes(extension)) {
      throw new Error('PDF 또는 DOCX 파일만 업로드 가능합니다.');
    }

    console.log('🚀 1단계 - Presigned URL 요청:', file.name);

    // 1단계: Presigned URL 받기 (RequestParam으로 전달!)
    const presignResponse = await apiClient.post<ResumePresignResponse>(
      '/api/presign/resume',
      null, // body는 null
      {
        params: {
          fileName: file.name, // Query Parameter로 전달
        },
      }
    );

    console.log('✅ Presigned URL 발급 성공');

    const { uploadUrl, key, requiredHeaders } = presignResponse.data;

    // 2단계: S3에 실제 파일 업로드 (PUT)
    console.log('📤 2단계 - S3 업로드 시작');

    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        ...requiredHeaders,
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
 * 2. 면접 세션 생성 및 첫 질문 받기
 */
export const createInterviewSession = async (
  data: CreateInterviewSessionRequest
): Promise<CreateInterviewSessionResponse> => {
  try {
    console.log('🎬 면접 세션 생성 요청:', data);

    const response = await apiClient.post<CreateInterviewSessionResponse>(
      '/api/interview-sessions',
      data
    );

    console.log('✅ 면접 세션 생성 성공:', response.data);

    return response.data;
  } catch (error) {
    console.error('❌ 면접 세션 생성 실패:', error);
    throw error;
  }
};

/**
 * 3. 녹음 업로드용 Presigned URL 받기
 */
export const getRecordingPresignUrl = async (
  questionId: number,
  contentType: string = 'audio/webm'
): Promise<RecordingPresignResponse> => {
  try {
    console.log('🎤 녹음 Presigned URL 요청:', { questionId, contentType });

    const response = await apiClient.post<RecordingPresignResponse>(
      '/api/presign/recording',
      {
        questionId,
        contentType,
      }
    );

    console.log('✅ 녹음 Presigned URL 발급 성공');

    return response.data;
  } catch (error) {
    console.error('❌ 녹음 Presigned URL 발급 실패:', error);
    throw error;
  }
};

/**
 * 4. 녹음 저장 (비동기 처리 시작)
 */
export const saveRecording = async (
  questionId: number
): Promise<SaveRecordingResponse> => {
  try {
    console.log('💾 녹음 저장 요청:', questionId);

    const response = await apiClient.post<SaveRecordingResponse>(
      `/api/questions/${questionId}/recordings`
    );

    console.log('✅ 녹음 저장 성공:', response.data);

    return response.data;
  } catch (error) {
    console.error('❌ 녹음 저장 실패:', error);
    throw error;
  }
};

/**
 * 5. 녹음 처리 상태 Polling (한 번만 조회)
 */
export const getRecordingResult = async (
  recordingId: number
): Promise<PollingResultResponse> => {
  try {
    const response = await apiClient.get<PollingResultResponse>(
      `/api/recordings/${recordingId}/results`
    );

    return response.data;
  } catch (error) {
    console.error('❌ Polling 조회 실패:', error);
    throw error;
  }
};

/**
 * 6. Polling 헬퍼 (자동으로 READY 상태까지 대기)
 */
export const pollRecordingResult = async (
  recordingId: number,
  maxAttempts: number = 60, // 최대 60번 (5분)
  interval: number = 5000 // 5초마다
): Promise<PollingResultResponse> => {
  let attempts = 0;

  console.log('🔄 Polling 시작:', recordingId);

  while (attempts < maxAttempts) {
    const result = await getRecordingResult(recordingId);

    console.log(`📊 Polling ${attempts + 1}/${maxAttempts}:`, result.status);

    if (result.status === 'READY' || result.status === 'FAILED') {
      console.log('✅ Polling 완료:', result.status);
      return result;
    }

    // WORKING 상태면 대기 후 재시도
    await new Promise((resolve) => setTimeout(resolve, interval));
    attempts++;
  }

  throw new Error('Polling timeout - 처리 시간이 너무 오래 걸립니다.');
};

/**
 * 7. 녹음 업로드 전체 플로우 (Presigned URL + S3 업로드 + 저장 + Polling)
 */
export const uploadRecordingAndGetNext = async (
  questionId: number,
  audioBlob: Blob
): Promise<NextQuestion | null> => {
  try {
    // 1단계: Presigned URL 받기
    const { uploadUrl, requiredHeaders } = await getRecordingPresignUrl(
      questionId,
      audioBlob.type || 'audio/webm'
    );

    // 2단계: S3에 업로드
    console.log('📤 녹음 S3 업로드 시작');

    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        ...requiredHeaders,
      },
      body: audioBlob,
    });

    if (!uploadResponse.ok) {
      throw new Error(`녹음 업로드 실패: ${uploadResponse.status}`);
    }

    console.log('✅ 녹음 S3 업로드 완료');

    // 3단계: 녹음 저장 (비동기 처리 시작)
    const { recordingId, status } = await saveRecording(questionId);

    console.log('💾 녹음 저장 완료. RecordingId:', recordingId, 'Status:', status);

    // 4단계: Polling으로 다음 질문 대기
    const result = await pollRecordingResult(recordingId);

    if (result.status === 'FAILED') {
      throw new Error('녹음 처리에 실패했습니다.');
    }

    return result.next;
  } catch (error) {
    console.error('❌ 녹음 업로드 전체 플로우 실패:', error);
    throw error;
  }
};

/**
 * 8. 시간초과 처리
 */
export const sendTimeout = async (
  questionId: number
): Promise<TimeoutResponse> => {
  try {
    console.log('⏱️ Timeout 처리:', questionId);

    const response = await apiClient.post<TimeoutResponse>(
      `/api/questions/${questionId}/timeout`
    );

    console.log('✅ Timeout 처리 완료:', response.data);

    return response.data;
  } catch (error) {
    console.error('❌ Timeout 처리 실패:', error);
    throw error;
  }
};

/**
 * 9. 최종 피드백 조회
 */
export const getFinalFeedback = async (
  sessionId: number
): Promise<FinalFeedbackResponse> => {
  try {
    console.log('📊 최종 피드백 조회:', sessionId);

    const response = await apiClient.get<FinalFeedbackResponse>(
      `/api/interview-sessions/${sessionId}`
    );

    console.log('✅ 피드백 조회 성공');

    return response.data;
  } catch (error) {
    console.error('❌ 피드백 조회 실패:', error);
    throw error;
  }
};

/**
 * 10. S3 Key에서 resumeId 추출 헬퍼 함수
 */
export const extractResumeId = (key: string): string => {
  // key 예시: "resume/123/fc749c97-b991-4d4b-ac39-19fb8e3ee91f.docx"
  // resumeId: "fc749c97-b991-4d4b-ac39-19fb8e3ee91f"
  
  const parts = key.split('/');
  if (parts.length < 3) {
    throw new Error('Invalid resume key format');
  }
  
  const fileNameWithExt = parts[parts.length - 1]; // "fc749c97-b991-4d4b-ac39-19fb8e3ee91f.docx"
  const resumeId = fileNameWithExt.split('.')[0]; // "fc749c97-b991-4d4b-ac39-19fb8e3ee91f"
  
  return resumeId;
};
