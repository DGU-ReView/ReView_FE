import Logo from '@/assets/logo.svg?react';
export default function CustomHeader() {
  return (
    <div className="w-full h-[69px] z-1 fixed top-18 left-0 flex items-center justify-center gap-[226px]">
      <Logo />
      <div className="flex justify-center items-center gap-20">
        <button className="text-lg font-medium">나의 면접</button>
        <button className="text-lg font-medium">아카이브</button>
        <button className="text-lg font-medium">Community</button>
        <button className="text-lg font-medium">MyPage</button>
      </div>
      <div className="flex justify-center items-center gap-20">
        <p>채채님</p>
        <button className="w-28 h-10 flex justify-center items-center text-white font-semibold bg-[#333333] rounded-full">로그아웃</button>
      </div>
    </div>
  );
}
