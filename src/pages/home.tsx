import Fire from '@/assets/fire.svg?react';
import LogoText from '@/assets/logoText.svg?react';
import Card from '@/components/home/card';
export default function Home() {
  return (
    <div className="w-full h-full flex justify-center items-center pl-55 pr-8">
      <div className="w-full flex flex-col justify-center items-center gap-20">
        <section className="w-full flex justify-between items-center">
          <div className="flex flex-col gap-8">
            <LogoText />
            <div className="text-2xl font-medium text-[#808080]/60">
              <p>당신의 열정을 응원해요</p>
              <p>RE:VIEW에서 당신의 도전을 되돌아보세요</p>
            </div>
          </div>
        </section>
        <section className="w-full flex justify-start items-center gap-20">
          <Card type="myInterview" />
          <Card type="community" />
          <Card type="myPage" />
        </section>
      </div>
      <Fire className="shrink-0" />
    </div>
  );
}
