import { useNavigate } from 'react-router-dom';

import Logo from '@/assets/logo.svg?react';
import { route } from '@/routes/route';

export default function CustomHeader() {
  const navigate = useNavigate();
  return (
    <div className="pt-10 w-full h-[109px] z-2 fixed top-0 left-0 flex items-center justify-around backdrop-blur-[10px]">
      <Logo className="shrink-0" />
      <div className="flex justify-center items-center gap-20 shrink-0">
        <button className="text-base font-medium">나의 면접</button>
        <button className="text-base font-medium">아카이브</button>
        <button className="text-base font-medium" onClick={() => navigate(route.community)}>
          Community
        </button>
        <button className="text-base font-medium">MyPage</button>
      </div>
      <div className="flex justify-center items-center gap-20 shrink-0">
        <p>채채님</p>
        <button className="w-28 h-10 flex justify-center items-center text-white font-semibold bg-[#333333] rounded-full">로그아웃</button>
      </div>
    </div>
  );
}
