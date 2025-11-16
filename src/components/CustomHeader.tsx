import { useNavigate } from 'react-router-dom';

import useGetUser from '@/hooks/useGetUser';
import usePostLogout from '@/hooks/usePostLogout';

import Logo from '@/assets/logo.svg?react';
import { route } from '@/routes/route';

export default function CustomHeader() {
  const { data: userInfo } = useGetUser();
  const { mutate: logout } = usePostLogout();
  const navigate = useNavigate();
  const handleLogin = () => {
    const authUrl = `${import.meta.env.VITE_API_BASE_URL}/oauth2/authorization/kakao`;
    window.open(authUrl, 'kakao-oauth', 'width=480,height=640');
  };
  return (
    <div className="pt-10 w-full h-[109px] z-2 fixed top-0 left-0 flex items-center justify-around backdrop-blur-[10px]">
      <Logo className="shrink-0" />
      <div className="flex justify-center items-center gap-20 shrink-0">
        <button className="text-base font-medium" onClick={() => navigate(route.myInterview)}>
          나의 면접
        </button>
        <button className="text-base font-medium" onClick={() => navigate(route.evaluate)}>
          평가하기
        </button>
        <button className="text-base font-medium" onClick={() => navigate(route.community)}>
          Community
        </button>
        <button className="text-base font-medium" onClick={() => navigate(route.myPage)}>
          MyPage
        </button>
      </div>
      <div className="flex justify-center items-center gap-20 shrink-0">
        {userInfo && <p>{userInfo.username}님</p>}
        {userInfo ? (
          <button className="w-28 h-10 flex justify-center items-center text-white font-semibold bg-[#333333] rounded-full" onClick={logout}>
            로그아웃
          </button>
        ) : (
          <button className="w-28 h-10 flex justify-center items-center text-white font-semibold bg-[#333333] rounded-full" onClick={handleLogin}>
            로그인
          </button>
        )}
      </div>
    </div>
  );
}
