import { getRandomQuestions } from '@/apis/myPage';
import { useCoreQuery } from '@/hooks/customQuery';

export default function useGetRandomQuestions(questionId: number | null) {
  const { data, isLoading, error } = useCoreQuery(['getRandomQuestions', questionId], () => getRandomQuestions(questionId!), {
    enabled: !!questionId,
  });
  return { data, isLoading, error };
}
