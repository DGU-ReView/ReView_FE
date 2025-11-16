type TInputProps = {
  text: string;
  onClick?: () => void;
};
export default function Tag({ text, onClick }: TInputProps) {
  return (
    <div onClick={onClick} className="flex items-center justify-center rounded-full w-fit text-sm font-medium text-[#E95F45] border border-[#E95F45] px-5 py-1">
      {text}
    </div>
  );
}
