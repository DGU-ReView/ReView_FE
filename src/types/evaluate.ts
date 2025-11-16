export type TEvaluateOtherResponse = {
  errorCode: string | null;
  message: string;
  result: {
    recordingId: number;
    question: string;
    sttText: string;
    jobRole: string;
    recordingUrl: string;
  };
};
export type TEvaluateOtherRequest = {
  recordingId: number;
  body: string;
  followUpQuestion?: string;
};
export type TEvaluateresponse = {
  errorCode: number | null;
  message: string;
  result: null;
};
