import { useState } from 'react';

import CustomInput from '../common/CustomInput';
import FormTitle from '../common/FormTitle';

function ReadOnlyField({ value, placeholder }: { value?: string; placeholder: string }) {
  return (
    <div className="min-h-30 rounded-lg bg-[#EDAC9F]/14 px-4 py-3 text-sm font-medium text-neutral-800 whitespace-pre-line">
      {value?.trim() ? value : <span className="text-neutral-400">{placeholder}</span>}
    </div>
  );
}

export const domainOptions = [
  { label: 'IT / 공학', value: 'IT_ENGINEERING' },
  { label: '비즈니스 / 금융', value: 'BUSINESS_FINANCE' },
  { label: '공공 / 사회', value: 'PUBLIC_SOCIAL' },
  { label: '의료 / 보건', value: 'HEALTH_MEDICAL' },
  { label: '예술 / 미디어', value: 'ART_MEDIA' },
  { label: '서비스 / 관광', value: 'SERVICE_TOURISM' },
  { label: '영업 / 유통', value: 'SALES_DISTRIBUTION' },
  { label: '기술 / 제조·건설', value: 'TECH_MANUFACTURING_CONSTRUCTION' },
  { label: '농업 / 수산', value: 'AGRICULTURE_FISHERY' },
] as const;

export type TValues = {
  companyName: string;
  domain:
    | 'IT_ENGINEERING'
    | 'BUSINESS_FINANCE'
    | 'PUBLIC_SOCIAL'
    | 'HEALTH_MEDICAL'
    | 'ART_MEDIA'
    | 'SERVICE_TOURISM'
    | 'SALES_DISTRIBUTION'
    | 'TECH_MANUFACTURING_CONSTRUCTION'
    | 'AGRICULTURE_FISHERY';
  job: string;
  interviewPreps: string;
  answerStrategies: string;
  tips: string;
};

type TField = {
  key: keyof TValues;
  label: string;
  placeholder: string;
};

const fields: TField[] = [
  { key: 'companyName', label: '1. 회사', placeholder: '지원했던 회사를 입력해주세요' },
  { key: 'domain', label: '2. 분야', placeholder: '관련 업계나 분야를 선택해주세요' },
  { key: 'job', label: '3. 직무', placeholder: '지원 직무를 입력해주세요' },
  { key: 'interviewPreps', label: '4. 면접 대비', placeholder: '준비 과정이나 방법을 입력해주세요' },
  { key: 'answerStrategies', label: '5. 답변 전략', placeholder: '답변할 때 사용한 전략을 입력해주세요' },
  { key: 'tips', label: '6. 기타 (그 외의 꿀팁)', placeholder: '추가로 공유하고 싶은 팁을 적어보세요' },
];

type TWriteFormProps = {
  readOnly?: boolean;
  values: Partial<TValues>;
  edit?: boolean;
  onChange?: (key: keyof TValues, value: string) => void;
};

type TDomainFieldProps = {
  value?: TValues['domain'];
  placeholder: string;
  readOnly: boolean;
  onChange?: (value: TValues['domain']) => void;
};

function DomainField({ value, placeholder, readOnly, onChange }: TDomainFieldProps) {
  const [open, setOpen] = useState(false);

  const selected = domainOptions.find((opt) => opt.value === value);
  const labelNode = selected ? <span>{selected.label}</span> : <span className="text-neutral-400">{placeholder}</span>;

  if (readOnly) {
    return (
      <div className="min-h-14 border border-[#E95F45] text-[#E95F45] rounded-lg px-4 flex items-center text-sm font-medium whitespace-pre-line cursor-default">
        {labelNode}
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        className="min-h-14 rounded-lg border border-[#E95F45] px-4 flex items-center text-sm font-medium text-[#E95F45]  justify-between cursor-pointer"
        onClick={() => setOpen((prev) => !prev)}
      >
        {labelNode}
        <span className="text-xs text-[#E95F45]">▼</span>
      </div>

      {open && (
        <div className="absolute z-10 mt-2 w-full rounded-lg bg-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] max-h-60 overflow-y-auto">
          {domainOptions.map((opt) => (
            <div
              key={opt.value}
              className="px-4 py-2 text-sm text-[#E95F45] hover:bg-neutral-100 cursor-pointer"
              onClick={() => {
                onChange?.(opt.value);
                setOpen(false);
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function WriteForm(props: TWriteFormProps) {
  const { readOnly = false, values = {}, edit = false, onChange } = props;

  return (
    <div className="w-full flex flex-col gap-8">
      {fields.map(({ key, label, placeholder }, idx) => (
        <section className="flex flex-col gap-5" key={key}>
          <FormTitle text={label} none={idx === 1} />

          {edit && idx < 3 ? null : key === 'domain' ? (
            <DomainField value={values.domain} placeholder={placeholder} readOnly={readOnly} onChange={(v) => onChange?.('domain', v)} />
          ) : readOnly ? (
            <ReadOnlyField value={values[key] as string | undefined} placeholder={placeholder} />
          ) : (
            <CustomInput value={(values[key] as string) ?? ''} placeholder={placeholder} onChange={(v) => onChange?.(key, v)} />
          )}
        </section>
      ))}
    </div>
  );
}
