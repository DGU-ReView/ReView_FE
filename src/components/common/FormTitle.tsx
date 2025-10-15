type TInputProps = {
  text: string;
};
export default function FormTitle({ text }: TInputProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[#E95F45] font-semibold text-[22px]">{text}</p>
      <hr className="text-[#E95F45]" />
    </div>
  );
}
