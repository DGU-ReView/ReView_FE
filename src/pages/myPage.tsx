import 'swiper/css';

import { useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';

import AddCard from '@/components/myPage/AddCard';
import EvaluateCard from '@/components/myPage/evaluateCard';
import InterviewCard from '@/components/myPage/interviewCard';
import Tag from '@/components/myPage/tag';

import AngryFrog from '@/assets/angryFrog.svg?react';
import Frog from '@/assets/frog.svg?react';
import { route } from '@/routes/route';

type CategoryKey = 'interview' | 'evaluate';

type Category = {
  key: CategoryKey;
  title: string;
  description: string;
  routes: string;
};

export default function MyPage() {
  const navigate = useNavigate();

  const categories: Category[] = [
    {
      key: 'interview',
      title: '나의 면접,',
      description: '그동안의 열정을 모았어요',
      routes: route.upload, // 업로드 페이지
    },
    {
      key: 'evaluate',
      title: '나의 평가,',
      description: '내가 남긴 흔적을 모았어요',
      routes: route.myEvaluate,
    },
  ];

  const tags = ['# 문제 해결력', '# 리더십', '# 협업'];
  const profile = true;

  const movePage = (routes: string, id: number) => {
    // id는 1부터 시작하도록 +1
    navigate(`${routes}/${id + 1}`);
  };

  return (
    <div className="flex flex-col gap-20 py-15">
      {/* 프로필 영역 */}
      <section className="w-full flex justify-center">
        <div className="flex flex-col w-fit gap-8">
          <p className="text-3xl font-bold">나의 프로필,</p>
          <div className="flex items-center">
            {profile ? <Frog className="size-80" /> : <AngryFrog className="size-80" />}
            <div className="bg-white/20 rounded-[20px] h-75 w-120 border border-[#F1F1F1] p-8 flex flex-col justify-between">
              {profile ? (
                <section className="flex flex-col gap-6">
                  <div className="flex flex-col gap-3">
                    <p className="text-xl font-extrabold text-[#333333]">경험 강조 분야</p>
                    <div className="flex items-center gap-3">
                      {tags.map((text, idx) => (
                        <Tag text={text} key={idx} />
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <p className="text-xl font-extrabold text-[#333333]">발전 필요 역량</p>
                    <div className="flex items-center gap-3">
                      {tags.map((text, idx) => (
                        <Tag text={text} key={idx} />
                      ))}
                    </div>
                  </div>
                </section>
              ) : (
                <p className="text-[#E95F45] text-lg font-medium">프로필이 아직 없습니다</p>
              )}
              <div className="cursor-pointer self-end">
                <Tag text={profile ? '수정하기' : '작성하기'} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 카드 슬라이더 영역 */}
      <section className="flex flex-col gap-8">
        {categories.map(({ title, description, routes, key }, idx) => (
          <div className="h-75 w-full flex gap-25" key={idx}>
            <div className="shrink-0 pl-20 flex flex-col gap-2.5">
              <p className="bg-[#E95F45]/20 px-1 w-fit rounded text-2xl font-bold">{title}</p>
              <p className="text-lg font-extralight">{description}</p>
            </div>

            <Swiper spaceBetween={50} slidesPerView={2.7} slidesOffsetAfter={50}>
              {/* + 카드 */}
              <SwiperSlide key="add-card">
                <AddCard onClick={() => navigate(routes)} />
              </SwiperSlide>

              {/* 더미 카드 4개 */}
              {[...Array(4)].map((_, i) => (
                <SwiperSlide key={i}>
                  {key === 'interview' ? (
                    <InterviewCard id={i + 1} title={`면접 ${i + 1}`} onClick={() => movePage(routes, i)} />
                  ) : (
                    <EvaluateCard title={`평가 ${i + 1}`} onClick={() => movePage(routes, i)} />
                  )}
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        ))}
      </section>
    </div>
  );
}
