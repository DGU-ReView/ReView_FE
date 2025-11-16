import { getQuestionAnswers } from '@/apis/myPage';
import { useCoreQuery } from '@/hooks/customQuery';

export default function useGetQuestionAnswers(questionId: number | null) {
  const { data, isLoading, error } = useCoreQuery(['getQuestionAnswers', questionId], () => getQuestionAnswers(questionId!), {
    enabled: !!questionId,
  });
  return { data, isLoading, error };
}
