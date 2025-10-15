import { Outlet } from 'react-router-dom';

import CustomHeader from '@/components/CustomHeader';

import Bg from '@/assets/bg.svg?react';

export default function Layout() {
  return (
    <div className="w-full h-screen flex flex-col justify-center pt-[109px]">
      <CustomHeader />
      <Bg className="blur-[74px] fixed -top-[210px] -left-[580px]" />
      <div className="z-1 h-full w-full">
        <Outlet />
      </div>
    </div>
  );
}
