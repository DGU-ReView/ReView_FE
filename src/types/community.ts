export type TCommumityListRequest = {
  cursors: Record<string, number>;
  limit: number;
};
export type TCommumityListResponse = {
  category: string;
  previews: {
    id?: number;
    title?: string;
  }[];
  nextCursor: number | null;
}[];

export type TCommunityPostRequest = {
  companyName: string;
  domain:
    | 'IT_ENGINEERING'
    | 'BUSINESS_FINANCE'
    | 'PUBLIC_SOCIAL'
    | 'HEALTH_MEDICAL'
    | 'ART_MEDIA'
    | 'SERVICE_TOURISM'
    | 'SALES_DISTRIBUTION'
    | 'TECH_MANUFACTURING_CONSTRUCTION'
    | 'AGRICULTURE_FISHERY';
  job: string;
  interviewPreps: string;
  answerStrategies: string;
  tips: string;
};
export type TCommumityDetailRequest = {
  pageId: number;
};
export type TCommumityDetailResponse = {
  id: number;
  companyName: string;
  domain:
    | 'IT_ENGINEERING'
    | 'BUSINESS_FINANCE'
    | 'PUBLIC_SOCIAL'
    | 'HEALTH_MEDICAL'
    | 'ART_MEDIA'
    | 'SERVICE_TOURISM'
    | 'SALES_DISTRIBUTION'
    | 'TECH_MANUFACTURING_CONSTRUCTION'
    | 'AGRICULTURE_FISHERY';
  job: string;
  interviewPreps: string;
  answerStrategies: string;
  tips: string;
  updatedAt: string;
};
export type TCommunityEditRequest = {
  pageId: number;
  interviewPreps: string;
  answerStrategies: string;
  tips: string;
};
