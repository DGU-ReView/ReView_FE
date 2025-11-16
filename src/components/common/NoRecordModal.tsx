import { useNavigate } from 'react-router-dom';

import { route } from '@/routes/route';

type TLoginModalProps = {
  onClose?: () => void;
};
export default function NoRecordModal({ onClose }: TLoginModalProps) {
  const navigate = useNavigate();
  const handleConfirm = () => {
    navigate(route.evaluate);
    onClose?.();
  };
  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex flex-col gap-1">
        <p className="font-bold">현재 평가할 수 있는 다른 지원자의 면접이 없습니다</p>
        <p>새 면접이 등록되면 다시 이용해 주세요</p>
      </div>
      <div className="mt-4 flex justify-end">
        <button type="button" className="h-11 px-7 rounded-2xl bg-[#E95F45] text-sm font-medium text-white" onClick={handleConfirm}>
          확인
        </button>
      </div>
    </div>
  );
}
