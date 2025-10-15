import { useNavigate } from 'react-router-dom';

import WriteForm from '@/components/community/writeForm';

import { route } from '@/routes/route';

export default function CommunityEdit() {
  const navigate = useNavigate();
  const id = 1;
  return (
    <div className="w-full min-h-full px-20 py-15">
      <div className="flex flex-col gap-20 w-full min-h-full bg-[#EEEDF2] rounded-[20px] shadow-[0_7px_24px_0_#24262b25] p-10">
        <div className="flex flex-col">
          <div className="flex items-start justify-between">
            <p className="font-bold text-3xl">카카오/백엔드 개발자</p>
          </div>
          <p className="font-extralight text-sm">최근 수정 날짜: 2025년 8월 31일 14시</p>
        </div>
        <WriteForm edit={true} />
        <div className="self-end flex justify-center items-center gap-4 font-semibold text-sm">
          <button className="h-14 w-45 text-[#E95F45] rounded-lg bg-white" onClick={() => navigate(`/community/detail/${id}`)}>
            작성 취소
          </button>
          <button className="h-14 w-45 bg-[#E95F45] rounded-lg text-white" onClick={() => navigate(route.community)}>
            저장하기
          </button>
        </div>
      </div>
    </div>
  );
}
