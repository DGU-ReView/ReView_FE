import { getInterviewSummary } from '@/apis/myPage';
import { useCoreQuery } from '@/hooks/customQuery';

export default function useGetInterviewSummary(interviewId: number) {
  const { data, isLoading, error } = useCoreQuery(['getInterviewSummary', interviewId], () => getInterviewSummary(interviewId), {
    enabled: !!interviewId,
  });
  return { data, isLoading, error };
}
