import CustomInput from '../common/CustomInput';
import FormTitle from '../common/FormTitle';

export type TValues = {
  company: string;
  category: string;
  role: string;
  prep: string;
  strategy: string;
  tips: string;
};

type TField = {
  key: keyof TValues;
  label: string;
  placeholder: string;
};

const fields: TField[] = [
  { key: 'company', label: '1. 회사', placeholder: '지원했던 회사를 입력해주세요' },
  { key: 'category', label: '2. 분야', placeholder: '관련 업계나 분야를 선택해주세요' },
  { key: 'role', label: '3. 직무', placeholder: '지원 직무를 입력해주세요' },
  { key: 'prep', label: '4. 면접 대비', placeholder: '준비 과정이나 방법을 입력해주세요' },
  { key: 'strategy', label: '5. 답변 전략', placeholder: '답변할 때 사용한 전략을 입력해주세요' },
  { key: 'tips', label: '6. 기타 (그 외의 꿀팁)', placeholder: '추가로 공유하고 싶은 팁을 적어보세요' },
];

function ReadOnlyField({ value, placeholder }: { value?: string; placeholder: string }) {
  return (
    <div className="min-h-30 rounded-lg bg-[#EDAC9F]/14 px-4 py-3 text-sm font-medium text-neutral-800 whitespace-pre-line">
      {value?.trim() ? value : <span className="text-neutral-400">{placeholder}</span>}
    </div>
  );
}

type TWriteFormProps = {
  readOnly?: boolean;
  values?: Partial<TValues>;
  edit?: boolean;
};

export default function WriteForm(props: TWriteFormProps) {
  const { readOnly = false, values = {}, edit = false } = props;

  return (
    <div className="w-full flex flex-col gap-8">
      {fields.map(({ key, label, placeholder }, idx) => (
        <section className="flex flex-col gap-5" key={key}>
          <FormTitle text={label} />
          {edit && idx < 3 ? null : readOnly ? (
            <ReadOnlyField value={values[key]} placeholder={placeholder} />
          ) : (
            <CustomInput value={values[key]} placeholder={placeholder} />
          )}
        </section>
      ))}
    </div>
  );
}
