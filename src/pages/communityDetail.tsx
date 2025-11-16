import { useNavigate, useParams } from 'react-router-dom';

import { formatUpdatedAt } from '@/utils/time';

import usegetCommunityDetail from '@/hooks/useGetCommunityDetail';

import type { TValues } from '@/components/community/writeForm';
import WriteForm from '@/components/community/writeForm';

import { route } from '@/routes/route';

export default function CommunityDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data } = usegetCommunityDetail({ pageId: Number(id) });
  const values: Partial<TValues> = data ?? {};

  return (
    <div className="w-full min-h-full px-20 py-15">
      <div className="flex flex-col gap-20 w-full min-h-full bg-[#EEEDF2] rounded-[20px] shadow-[0_7px_24px_0_#24262b25] p-10">
        <div className="flex flex-col">
          <div className="flex items-start justify-between">
            <p className="font-bold text-3xl">{data?.job}</p>
            <button
              className="h-14 w-45 bg-[#E95F45] rounded-lg text-white font-semibold text-sm"
              onClick={() => navigate(route.communityEdit + `/${data?.id}`)}
            >
              수정하기
            </button>
          </div>
          <p className="font-extralight text-sm">최근 수정 날짜: {formatUpdatedAt(data?.updatedAt)}</p>
        </div>

        <WriteForm readOnly values={values} />
      </div>
    </div>
  );
}
