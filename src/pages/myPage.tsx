import 'swiper/css';

import { Swiper, SwiperSlide } from 'swiper/react';

import { getExperienceHashTags, getGrowthHashTags } from '@/types/myPage';

import { useModalStore } from '@/stores/modalStore';
import useGetMyFeedback from '@/hooks/useGetMyFeedback';
import useGetMyInterview from '@/hooks/useGetMyInterview';
import useGetMyProfile from '@/hooks/useGetMyProfile';

import AddCard from '@/components/myPage/AddCard';
import EvaluateCard from '@/components/myPage/evaluateCard';
import InterviewCard from '@/components/myPage/interviewCard';
import Tag from '@/components/myPage/tag';

import AngryFrog from '@/assets/angryFrog.svg?react';
import Frog from '@/assets/frog.svg?react';
import { route } from '@/routes/route';

export default function MyPage() {
  const { openModal } = useModalStore();
  const { data: profileData } = useGetMyProfile();
  const { data: myInterviewData } = useGetMyInterview({ cursor: {}, limit: 12 });
  const { data: myFeedbackData } = useGetMyFeedback({ cursor: {}, limit: 12 });
  const categories = [
    { title: '나의 면접,', description: '그동안의 열정을 모았어요', routes: route.myInterview, categoryData: myInterviewData },
    { title: '나의 평가,', description: '내가 남긴 흔적을 모았어요', routes: route.myEvaluate, categoryData: myFeedbackData },
  ];
  const experienceTags = getExperienceHashTags(profileData?.result.experienceTags);
  const growthTags = getGrowthHashTags(profileData?.result.growthTags);

  const profile = experienceTags.length && growthTags.length;
  const movePage = (routes: string, id: number) => {
    window.location.replace(`${routes}/${id}`);
  };
  return (
    <div className="flex flex-col gap-20 py-15">
      <section className="w-full flex justify-center">
        <div className="flex flex-col w-fit gap-8">
          <p className="text-3xl font-bold">나의 프로필,</p>
          <div className="flex items-center">
            {profile ? <Frog className="size-80" /> : <AngryFrog className="size-80" />}
            <div className="bg-white/20 rounded-[20px] h-75 w-120 border border-[#F1F1F1] p-8 flex flex-col justify-between">
              {profile ? (
                <section className=" flex flex-col gap-6">
                  <div className="flex flex-col gap-3">
                    <p className="text-xl font-extrabold text-[#333333]">경험 강조 분야</p>
                    <div className="flex items-center gap-3">
                      {experienceTags.map((text, idx) => (
                        <Tag text={text} key={idx} />
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <p className="text-xl font-extrabold text-[#333333]">발전 필요 역량</p>
                    <div className="flex items-center gap-3">
                      {growthTags.map((text, idx) => (
                        <Tag text={text} key={idx} />
                      ))}
                    </div>
                  </div>
                </section>
              ) : (
                <p className="text-[#E95F45] text-lg font-medium">프로필이 아직 없습니다</p>
              )}
              <div className="cursor-pointer self-end">
                <Tag text={profile ? '수정하기' : '작성하기'} onClick={() => openModal('alert')} />
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="flex flex-col gap-8">
        {categories.map(({ title, description, routes, categoryData }, idx) => {
          const items = categoryData?.result.items ?? [];
          const totalSlides = items.length + 1;
          const slidesPerView = totalSlides >= 3 ? 2.7 : totalSlides || 1;

          return (
            <div className="h-75 w-full flex gap-25" key={idx}>
              <div className="shrink-0 pl-20 flex flex-col gap-2.5">
                <p className="bg-[#E95F45]/20 px-1 w-fit rounded text-2xl font-bold">{title}</p>
                <p className="text-lg font-extralight">{description}</p>
              </div>
              <Swiper spaceBetween={50} slidesPerView={slidesPerView}>
                <SwiperSlide key="add-card" className="!mr-14">
                  <AddCard />
                </SwiperSlide>

                {title === '나의 면접,'
                  ? myInterviewData?.result.items.map(({ interviewId, jobRole }) => (
                      <SwiperSlide key={interviewId}>
                        <InterviewCard id={interviewId} title={jobRole} onClick={() => movePage(routes, interviewId)} />
                      </SwiperSlide>
                    ))
                  : myFeedbackData?.result.items.map(({ peerFeedbackId, title: jobTitle }) => (
                      <SwiperSlide key={peerFeedbackId}>
                        <EvaluateCard title={jobTitle} onClick={() => movePage(routes, peerFeedbackId)} />
                      </SwiperSlide>
                    ))}
              </Swiper>
            </div>
          );
        })}
      </section>
    </div>
  );
}
