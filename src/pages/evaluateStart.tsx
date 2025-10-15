import CustomInput from '@/components/common/CustomInput';
import FormTitle from '@/components/common/FormTitle';

import O from '@/assets/o.svg?react';
import X from '@/assets/x.svg?react';

export default function EvaluateStart() {
  const text =
    '회사/직무/맥락 등 평가에 도움이 될 수 있는 정보회사/직무/맥락 등 평가에 도움이 될 수 있는 정보회사/직무/맥락 등 평가에 도움이 될 수 있는 정보회사/직무/맥락 등 평가에 도움이 될 수 있는 정보회사/직무/맥락 등 평가에 도움이 될 수 있는 정보회사/직무/맥락 등 평가에 도움이 될 수 있는 정보회사/직무/맥락 등 평가에 도움이 될 수 있는 정보회사/직무/맥락 등 평..........';
  return (
    <div className="flex gap-20 w-full min-h-full p-20">
      <div className="flex flex-col gap-4 shrink-0">
        <p className="font-bold text-3xl">EVALUATE</p>
        <p className="font-extralight text-4xl">타인의 면접 봐주기,</p>
      </div>
      <div className="w-full bg-[#EEEDF2] rounded-[20px] shadow-[0_7px_24px_0_#24262b44] h-full p-8 flex flex-col gap-8">
        <section className="bg-white rounded-[20px] p-5 font-normal text-sm">{text}</section>
        <section className="flex flex-col gap-8">
          <FormTitle text="1. 간단히 자기소개를 해주세요" />
          <div className="h-13 w-full rounded-[15px] bg-[#E95F45] p-2">-</div>
          <div className="flex flex-col gap-3 bg-white rounded-[20px] p-5 font-normal text-sm">
            <p className="text-xs font-normal text-[#8D8D8D]">누구누구 사용자의 답변</p>
            {text}
          </div>
        </section>
        <section className="flex flex-col gap-8">
          <FormTitle text="평가 입력하기" />
          <CustomInput placeholder={'평가를 입력해주세요'} />
        </section>
        <section className="flex flex-col gap-8">
          <FormTitle text="질문 입력하기 (선택)" />
          <CustomInput placeholder={'30자 이내의 질문을 입력해주세요'} />
        </section>
        <section className="flex flex-col gap-8">
          <FormTitle text="평가 조건 충족 여부" />
          <div className="w-full flex gap-2">
            <div className="w-full h-10 px-4 flex items-center justify-between bg-white text-sm font-normal rounded-[20px]">
              <p>평가 글자수</p>
              <div className="flex items-center gap-2">
                <p className="text-xs">92 / 100 bytes</p>
                <X className="size-5" />
              </div>
            </div>
            <div className="w-full h-10 px-4 flex items-center justify-between bg-white font-normal text-sm rounded-[20px]">
              <p className="text-sm">페이지에 머문 시간</p>
              <div className="flex items-center gap-2">
                <p className="text-xs">90 / 90s</p>
                <O className="size-5" />
              </div>
            </div>
          </div>
        </section>
        <button className="self-end h-13 mt-10 w-50 bg-[#E95F45] rounded-lg text-white">제출하기</button>
      </div>
    </div>
  );
}
