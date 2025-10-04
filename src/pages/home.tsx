import Card from '@/components/home/card';

import Fire from '@/assets/fire.svg?react';

export default function Home() {
  return (
    <div className="w-full h-full pl-25">
      <div className="w-full h-full flex flex-col justify-center items-start">
        <section>
          <div className="flex flex-col gap-8">
            <div className="text-5xl flex flex-col gap-4">
              <p className="font-bold">RE:VIEW</p>
              <p className="font-light">면접을 새롭게,</p>
            </div>
            <div className="text-base font-normal text-[#808080]/60">
              <p>당신의 열정을 응원해요</p>
              <p>RE:VIEW에서 당신의 도전을 되돌아보세요</p>
            </div>
          </div>
        </section>
        <section className="w-full flex justify-around items-center gap-15">
          <div className="flex justify-between items-cente gap-5">
            <Card type="myInterview" />
            <Card type="community" />
            <Card type="myPage" />
          </div>
          <Fire className="size-90 shrink-0" />
        </section>
      </div>
    </div>
  );
}
