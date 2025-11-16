export type TMyInterviewRequest = {
  cursor: Record<string, number>;
  limit: number;
};
export type TMyFeedbackRequest = {
  peerfeedbackId: number;
};
export type TMyFeedbackDetailResponse = {
  errorCode: null | string;
  message: string;
  result: {
    jobRole: string;
    createdAt: string;
    question: string;
    myfeedback: string;
    myfollowUpQuestion: string;
  };
};
export type TMyInterviewResponse = {
  errorCode: null | string;
  message: string;
  result: {
    items: {
      interviewId: number;
      jobRole: string;
    }[];
    nextCursor: number | null;
    hasNext: boolean;
  };
};
export type TMyFeedbackResponse = {
  errorCode: null | string;
  message: string;
  result: {
    items: {
      peerFeedbackId: number;
      title: string;
    }[];
    nextCursor: number | null;
    hasNext: boolean;
  };
};
export type TPatchProfileRequest = {
  experienceTags: TExperienceTags[];
  growthTags: TGrowthTags[];
};
export type TPatchProfileResponse = {
  errorCode: null | string;
  message: string;
  result: { experienceTags: TExperienceTags[]; growthTags: TGrowthTags[] };
};
export type TPatchRequest = {
  interviewId: number;
  title: string;
};
export type TDeleteRequest = {
  sessionId: number;
};
export type TDeleteResponse = {
  errorCode: null | string;
  message: string;
  result: null;
};
export type TMyProfileResponse = {
  errorCode: null | string;
  message: string;
  result: {
    experienceTags?: TExperienceTags[];
    growthTags?: TGrowthTags[];
  };
};
export type TExperienceTags = 'PROBLEM_SOLVING' | 'COLLABORATION' | 'LEADERSHIP' | 'EXPERTISE' | 'CHALLENGE' | 'DIVERSITY' | 'PERSISTENCE' | 'ADAPTABILITY';
export type TGrowthTags = 'LOGICALITY' | 'CONCRETENESS' | 'CONCISENESS' | 'SELF_REFLECTION' | 'JOB_FIT' | 'CONFIDENCE' | 'CONSISTENCY' | 'CREATIVITY';

export const EXPERIENCE_TAG_LABELS: Record<TExperienceTags, string> = {
  PROBLEM_SOLVING: '문제해결력',
  COLLABORATION: '협업경험',
  LEADERSHIP: '리더십',
  EXPERTISE: '전문성',
  CHALLENGE: '도전정신',
  DIVERSITY: '다양성경험',
  PERSISTENCE: '지속성',
  ADAPTABILITY: '적응력',
};

export const GROWTH_TAG_LABELS: Record<TGrowthTags, string> = {
  LOGICALITY: '논리성',
  CONCRETENESS: '구체성',
  CONCISENESS: '간결성',
  SELF_REFLECTION: '자기성찰',
  JOB_FIT: '직무적합성',
  CONFIDENCE: '자신감',
  CONSISTENCY: '일관성',
  CREATIVITY: '창의성',
};
export const getExperienceHashTags = (tags?: TExperienceTags[]) => (tags ?? []).map((tag) => `# ${EXPERIENCE_TAG_LABELS[tag]}`);

export const getGrowthHashTags = (tags?: TGrowthTags[]) => (tags ?? []).map((tag) => `# ${GROWTH_TAG_LABELS[tag]}`);

// 나의 면접 상세 - 전체 요약 API
export type TInterviewSummaryRequest = {
  interviewId: number;
};

export type TQuestionCard = {
  order: number;
  questionId: number;
};

export type TAnswerCheckItem = {
  order: number;
  questionId: number;
  question: string;
  answerText: string | null;
  recordUrl: string;
};

export type TInterviewSummaryResponse = {
  errorCode: null | string;
  message: string;
  result: {
    title: string;
    timedOutCount: number;
    questionCards: TQuestionCard[];
    firstQuestionThread: TAnswerCheckItem[];
  };
};

// 나의 면접 상세 - 질문별 답변 확인 API
export type TQuestionAnswersRequest = {
  questionId: number;
};

export type TQuestionAnswersResponse = {
  errorCode: null | string;
  message: string;
  result: TAnswerCheckItem[];
};

// 나의 면접 상세 - 질문별 피드백 조회 API
export type TQuestionFeedbackRequest = {
  questionId: number;
};

export type TQuestionFeedbackResponse = {
  errorCode: null | string;
  message: string;
  result: {
    aiFeedback: string;
    selfFeedback: string;
    peerItems: string[];
  };
};

// 나의 면접 상세 - 질문별 랜덤 질문 답변 확인 API
export type TRandomQuestionItem = {
  question: string;
  aiFeedback: string;
  selfFeedback: string;
  answerText: string;
  recordingUrl: string;
};

export type TRandomQuestionsResponse = {
  errorCode: null | string;
  message: string;
  result: TRandomQuestionItem[];
};
