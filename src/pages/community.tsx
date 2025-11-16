import 'swiper/css';

import { useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';

import useGetCommunityList from '@/hooks/useGetCommunityList';

import CommunityCard from '@/components/community/communityCard';

import Frog from '@/assets/frog.svg?react';
import Search from '@/assets/search.svg?react';
import { route } from '@/routes/route';

export default function Community() {
  const navigate = useNavigate();
  const { data } = useGetCommunityList({ cursors: {}, limit: 20 });
  const categories = [
    { label: 'IT / 공학', value: 'IT_ENGINEERING' },
    { label: '비즈니스 / 금융', value: 'BUSINESS_FINANCE' },
    { label: '공공 / 사회', value: 'PUBLIC_SOCIAL' },
    { label: '의료 / 보건', value: 'HEALTH_MEDICAL' },
    { label: '예술 / 미디어', value: 'ART_MEDIA' },
    { label: '서비스 / 관광', value: 'SERVICE_TOURISM' },
    { label: '영업 / 유통', value: 'SALES_DISTRIBUTION' },
    { label: '기술 / 제조·건설', value: 'TECH_MANUFACTURING_CONSTRUCTION' },
    { label: '농업 / 수산', value: 'AGRICULTURE_FISHERY' },
  ] as const;

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
          <button
            className="w-full h-13 rounded-lg flex items-center justify-center bg-[#E95F45] text-white text-base font-medium"
            onClick={() => navigate(route.communityWrite)}
          >
            게시물 쓰러가기
          </button>
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
          {categories.map(({ label, value }) => {
            const categoryData = data?.find((d) => d.category === value);
            const previews = categoryData?.previews ?? [];

            if (!previews.length) return null;

            const isSingle = previews.length <= 1;
            const slidesPerView = previews.length >= 3 ? 2.7 : previews.length;

            return (
              <div className="w-full flex gap-25" key={value}>
                <div className="text-xl font-bold shrink-0 pl-20 flex flex-col gap-1">
                  <p className="bg-[#E95F45]/20 px-1 w-fit rounded">{label}</p>
                  <p>면접자들과 공유해요</p>
                </div>

                {isSingle ? (
                  <div className="flex-1 flex gap-5">
                    <CommunityCard title={previews[0].title} onClick={() => navigate(route.communityDetail + `/${previews[0].id}`)} />
                  </div>
                ) : (
                  <Swiper className="flex-1" spaceBetween={50} slidesPerView={slidesPerView} slidesOffsetAfter={50}>
                    {previews.map(({ id, title }) => (
                      <SwiperSlide key={id}>
                        <CommunityCard title={title} onClick={() => navigate(route.communityDetail + `/${id}`)} />
                      </SwiperSlide>
                    ))}
                  </Swiper>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
