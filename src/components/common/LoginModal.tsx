type TLoginModalProps = {
  onClose?: () => void;
};
export default function LoginModal({ onClose }: TLoginModalProps) {
  const handleLogin = () => {
    const authUrl = `${import.meta.env.VITE_API_BASE_URL}/oauth2/authorization/kakao`;
    window.open(authUrl, 'kakao-oauth', 'width=480,height=640');
  };
  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex flex-col gap-1">
        <p className="font-bold">로그인이 필요한 서비스에요</p>
        <p>로그인 하시겠어요?</p>
      </div>
      <div className="mt-4 flex justify-end gap-3">
        <button type="button" className="h-11 px-7 rounded-2xl bg-[#F5F5F5] text-sm font-medium text-[#666666]" onClick={onClose}>
          취소
        </button>
        <button type="button" className="h-11 px-7 rounded-2xl bg-[#E95F45] text-sm font-medium text-white" onClick={handleLogin}>
          로그인 하기
        </button>
      </div>
    </div>
  );
}
