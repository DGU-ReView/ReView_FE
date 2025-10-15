export default function MyEvaluate() {
  const text = 'text-[#E95F45]';
  const question = '1. 간단히 자기소개를 해주세요';
  const answer =
    '예상 질문은 잘 맞췄지만 꼬리 질문에서 말이 막혀 아쉬웠습니다. 분위기는 생각보다 편안했지만 긴장 탓에 말이 빨라졌고, 직무 관련 경험을 구체적으로 설명했을 때는 면접관이 긍정적인 반응을 보였습니다. 다만 마지막 자기소개를 충분히 준비하지 못해 아쉬움이 남...예상 질문은 잘 맞췄지만 꼬리 질문에서 말이 막혀 아쉬웠습니다. 분위기는 생각보다 편안했지만 긴장 탓에 말이 빨라졌고, 직무 관련 경험을 구체적으로 설명했을 때는 면접관이 긍정적인 반응을 보였습니다. 다만 마지막 자기소개를 충분히 준비하지 못해 아쉬움이 남... 예상 질문은 잘 맞췄지만 꼬리 질문에서 말이 막혀 아쉬웠습니다.  직무 관련 경험을 구체적으로 설명했을 때는 면접관이 긍정적인 반응을 보였습니다. 다만 마지막 자기소개를 충분히 준비하지 못해 아쉬움이 남...예상 질문은 잘 맞췄지만 꼬리 질문에서 말이 막혀 아쉬웠습니다. 분위기는 생각보다 편안했지만 긴장 탓에 말이 빨라졌고, 직무 관련 경험을 구체적으로 설명했을 때는 면접관이 긍정적인 반응을 보였습니다.';
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
            10월 5일 <span className={text}>어쩌구</span> 회사의 <span className={text}>어쩌구</span> 직무의 사용자에게 아래와 같은 피드백을 남겼어요,
          </p>
          <div className="flex flex-col gap-4 border border-[#F1F1F1] bg-[#F4F4F4] p-6 rounded-[20px]">
            <p className="text-lg font-medium">{question}</p>
            <p className="text-sm">{answer}</p>
          </div>
        </section>
        <section className="w-230 flex flex-col gap-5">
          <p className="text-xl font-medium">
            10월 5일 <span className={text}>어쩌구</span> 회사의 <span className={text}>어쩌구</span> 직무의 사용자에게 아래와 같은 질문을 남겼어요,
          </p>
          <div className="flex flex-col gap-4  border border-[#F1F1F1] bg-[#F4F4F4] p-6 rounded-[20px]">
            <p className="text-lg font-medium">{question}</p>
            <p className="text-sm">{answer}</p>
          </div>
        </section>
      </div>
    </div>
  );
}
