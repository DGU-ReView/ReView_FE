import 'swiper/css';

import { Swiper, SwiperSlide } from 'swiper/react';

import CommunityCard from '@/components/community/communityCard';

import Frog from '@/assets/frog.svg?react';
import Search from '@/assets/search.svg?react';

export default function Community() {
  const categories = ['IT 계열', '상경 계열', '이공 계열'];
  return (
    <>
      <section className="w-full h-full flex flex-col items-center justify-center gap-30">
        <div className="flex flex-col gap-10 w-172.5">
          <div className="flex flex-col text-5xl gap-5">
            <p className="font-bold">COMMUNITY</p>
            <p className="font-extralight">면접 경험을 공유하고 꿀팁 얻어가요 ,</p>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="면접 경험을 검색해보세요"
              className="w-full pl-6 pr-17 py-2 rounded-lg h-13 border border-[#E95F45]/40 placeholder:text-[#E95F45] text-[#E95F45] text-base font-medium focus:outline focus:outline-[#E95F45]"
            />
            <Search className="absolute right-6 top-1/2 -translate-y-1/2 size-5" />
          </div>
          <button className="w-full h-13 rounded-lg flex items-center justify-center bg-[#E95F45] text-white text-base font-medium">게시물 쓰러가기</button>
        </div>
      </section>
      <section className="w-full h-fit flex flex-col gap-20">
        <div className="flex items-center gap-4 px-20">
          <Frog className="size-40" />
          <div className="flex flex-col gap-2">
            <p className="text-2xl font-bold">면접 경험 엿보기</p>
            <p className="font-light">다른 사람들은 이렇게 답했어요</p>
          </div>
        </div>
        <div className="flex flex-col gap-8">
          {categories.map((title, idx) => (
            <div className="h-75 w-full flex gap-25" key={idx}>
              <div className="text-xl font-bold shrink-0 pl-20 flex flex-col gap-1">
                <p className="bg-[#E95F45]/20 px-1 w-fit rounded">{title}</p>
                <p>면접자들과 공유해요</p>
              </div>
              <Swiper spaceBetween={50} slidesPerView={2.7} slidesOffsetAfter={50}>
                {[...Array(5)].map((_, i) => (
                  <SwiperSlide key={i}>
                    <CommunityCard />
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
