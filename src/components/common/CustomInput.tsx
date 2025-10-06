type TInputProps = {
  placeholder: string;
};
export default function CustomInput({ placeholder }: TInputProps) {
  return (
    <textarea
      className="w-full p-4 focus:outline focus:outline-[#E95F45] font-medium  text-sm resize-none h-30 rounded-lg bg-[#EDAC9F]/14 placeholder:font-medium placeholder:text-sm placeholder:text-[#E95F45]/70"
      placeholder={placeholder}
    />
  );
}
