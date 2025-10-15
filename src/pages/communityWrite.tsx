import { useNavigate } from 'react-router-dom';

import WriteForm from '@/components/community/writeForm';

import { route } from '@/routes/route';

export default function CommunityWrite() {
  const navigate = useNavigate();
  const id = 1;
  return (
    <div className="w-full min-h-full px-20 py-15">
      <div className="flex flex-col gap-20 w-full min-h-full bg-[#EEEDF2] rounded-[20px] shadow-[0_7px_24px_0_#24262b25] p-10">
        <WriteForm />
        <div className="self-end flex justify-center items-center gap-4 font-semibold text-sm">
          <button className="h-14 w-45 text-[#E95F45] rounded-lg bg-white" onClick={() => navigate(route.community)}>
            작성 취소
          </button>
          <button className="h-14 w-45 bg-[#E95F45] rounded-lg text-white" onClick={() => navigate(`/community/detail/${id}`)}>
            저장하기
          </button>
        </div>
      </div>
    </div>
  );
}
