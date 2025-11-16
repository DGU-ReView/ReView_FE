import { getOtherInterview } from '@/apis/evaluate';

import { useCoreQuery } from '@/hooks/customQuery';

export default function useGetOtherInterview() {
  const { data } = useCoreQuery(['getOtherInterview'], () => getOtherInterview());
  return { data };
}
