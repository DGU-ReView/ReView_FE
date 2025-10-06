import { useNavigate } from 'react-router-dom';

import Frog from '@/assets/frog.svg?react';
import { route } from '@/routes/route';

export default function Evaluate() {
  const navigate = useNavigate();
  const textStyle = 'font-base text-sm mt-1';
  return (
    <div className="w-full h-full px-20 pt-20">
      <div className="flex flex-col gap-4">
        <p className="font-bold text-3xl">EVALUATE</p>
        <p className="font-extralight text-4xl">타인의 면접 봐주기,</p>
      </div>
      <div className="w-full flex justify-center items-center">
        <div
          className="w-100 h-110 rounded-[20px] shadow-[0_7px_24px_0_#44474c21] flex flex-col gap-6 justify-center items-center cursor-pointer hover:shadow-[0_7px_24px_0_#25272b2d]"
          onClick={() => navigate(route.evaluateStart)}
        >
          <Frog className="size-50" />
          <div className="flex flex-col items-center">
            <p className="font-bold text-2xl mb-2">평가 시작하기</p>
            <p className={textStyle}>공정하고 구체적인 피드백으로 서로를 성장시켜요</p>
            <p className={textStyle}>경험을 바탕으로 강점과 개선점을 명확히 적어주세요</p>
            <p className={textStyle}>예의를 지키되 솔직하게, 서로의 성장을 도와요</p>
          </div>
        </div>
      </div>
    </div>
  );
}
