type TInputProps = {
  text: string;
  none?: boolean;
};
export default function FormTitle({ text, none }: TInputProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[#E95F45] font-semibold text-[22px]">{text}</p>
      {!none && <hr className="text-[#E95F45]" />}
    </div>
  );
}
