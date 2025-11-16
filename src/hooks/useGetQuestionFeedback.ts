import { getQuestionFeedback } from '@/apis/myPage';
import { useCoreQuery } from '@/hooks/customQuery';

export default function useGetQuestionFeedback(questionId: number | null) {
  const { data, isLoading, error } = useCoreQuery(['getQuestionFeedback', questionId], () => getQuestionFeedback(questionId!), {
    enabled: !!questionId,
  });
  return { data, isLoading, error };
}
