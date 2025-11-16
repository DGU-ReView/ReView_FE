type TInputProps = {
  placeholder: string;
  value?: string;
  onChange?: (value: string) => void;
};

export default function CustomInput({ placeholder, value, onChange }: TInputProps) {
  return (
    <textarea
      className="w-full p-4 focus:outline focus:outline-[#E95F45] font-medium text-sm resize-none h-30 rounded-lg bg-[#EDAC9F]/14 placeholder:font-medium placeholder:text-sm placeholder:text-[#E95F45]/70"
      placeholder={placeholder}
      value={value ?? ''}
      onChange={(e) => onChange?.(e.target.value)}
    />
  );
}
