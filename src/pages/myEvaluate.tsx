import { useParams } from 'react-router-dom';

import useGetFeedbackdetail from '@/hooks/useGetFeedbackdetail';

export default function MyEvaluate() {
  const { id } = useParams<{ id: string }>();
  const { data } = useGetFeedbackdetail({ peerfeedbackId: Number(id) });
  const text = 'text-[#E95F45]';
  return (
    <div className="w-full h-full px-20 pt-15 flex items-start justify-between">
      <div className="flex flex-col gap-4">
        <p className="font-bold text-3xl">MY:</p>
        <p className="font-bold text-3xl">FEEDBACK</p>
        <p className="font-extralight text-4xl">나의 평가,</p>
      </div>
      <div className="w-full flex flex-col justify-center items-center gap-10">
        <section className="w-230 flex flex-col gap-5">
          <p className="text-xl font-medium">
            {data?.result.createdAt} <span className={text}>{data?.result.jobRole}</span> 직무의 사용자에게 아래와 같은 피드백을 남겼어요,
          </p>
          <div className="flex flex-col gap-4 border border-[#F1F1F1] bg-[#F4F4F4] p-6 rounded-[20px]">
            <p className="text-lg font-medium">{data?.result.question}</p>
            <p className="text-sm">{data?.result.myfeedback ?? ''}</p>
          </div>
        </section>
        <section className="w-230 flex flex-col gap-5">
          <p className="text-xl font-medium">
            {data?.result.createdAt} <span className={text}>{data?.result.jobRole}</span> 직무의 사용자에게 아래와 같은 질문을 남겼어요,
          </p>
          <div className="flex flex-col gap-4  border border-[#F1F1F1] bg-[#F4F4F4] p-6 rounded-[20px]">
            <p className="text-lg font-medium">{data?.result.myfollowUpQuestion ?? ''}</p>
          </div>
        </section>
      </div>
    </div>
  );
}
