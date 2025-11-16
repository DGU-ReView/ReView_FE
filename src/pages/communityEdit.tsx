import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { formatUpdatedAt } from '@/utils/time';

import useGetCommunityDetail from '@/hooks/useGetCommunityDetail';
import useUpdateCommunity from '@/hooks/useUpdateCommunity';

import WriteForm, { type TValues } from '@/components/community/writeForm';

import { route } from '@/routes/route';

export default function CommunityEdit() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { data } = useGetCommunityDetail({ pageId: Number(id) });
  const { mutate } = useUpdateCommunity();

  const [values, setValues] = useState<Partial<TValues>>({});

  useEffect(() => {
    if (!data) return;
    setValues(data);
  }, [data]);

  const handleChange = (key: keyof TValues, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    if (!id) return;
    console.log('values', values);
    mutate(
      {
        pageId: Number(id),
        interviewPreps: values.interviewPreps ?? '',
        answerStrategies: values.answerStrategies ?? '',
        tips: values.tips ?? '',
      },
      {
        onSuccess: () => {
          navigate(route.community);
        },
      },
    );
  };

  return (
    <div className="w-full min-h-full px-20 py-15">
      <div className="flex flex-col gap-20 w-full min-h-full bg-[#EEEDF2] rounded-[20px] shadow-[0_7px_24px_0_#24262b25] p-10">
        <div className="flex flex-col">
          <div className="flex items-start justify-between h-14">
            <p className="font-bold text-3xl">{data?.job}</p>
          </div>
          <p className="font-extralight text-sm">최근 수정 날짜: {data?.updatedAt ? formatUpdatedAt(data.updatedAt) : '-'}</p>
        </div>
        <WriteForm edit values={values} onChange={handleChange} />
        <div className="self-end flex justify-center items-center gap-4 font-semibold text-sm">
          <button className="h-14 w-45 text-[#E95F45] rounded-lg bg-white" onClick={() => navigate(`/community/detail/${id}`)}>
            작성 취소
          </button>
          <button className="h-14 w-45 bg-[#E95F45] rounded-lg text-white" onClick={handleSubmit}>
            저장하기
          </button>
        </div>
      </div>
    </div>
  );
}
