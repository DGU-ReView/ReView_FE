import { useEffect, useState } from 'react';

import { EXPERIENCE_TAG_LABELS, GROWTH_TAG_LABELS, type TExperienceTags, type TGrowthTags } from '@/types/myPage';

import useGetMyProfile from '@/hooks/useGetMyProfile';
import usePutProfile from '@/hooks/usePutProfile';

type TProfileModalProps = {
  onClose: () => void;
};

export default function ProfileModal({ onClose }: TProfileModalProps) {
  const titleStyle = 'text-base font-bold';
  const sectionStyle = 'flex flex-col gap-3';

  const { data: profileData } = useGetMyProfile();
  const { mutate: putProfile } = usePutProfile();
  const [selectedExperience, setSelectedExperience] = useState<TExperienceTags[]>([]);
  const [selectedGrowth, setSelectedGrowth] = useState<TGrowthTags[]>([]);

  useEffect(() => {
    if (!profileData?.result) return;

    setSelectedExperience(profileData.result.experienceTags ?? []);
    setSelectedGrowth(profileData.result.growthTags ?? []);
  }, [profileData]);

  const toggleExperience = (key: TExperienceTags) => {
    setSelectedExperience((prev) => {
      const exists = prev.includes(key);
      if (exists) {
        return prev.filter((k) => k !== key);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, key];
    });
  };

  const toggleGrowth = (key: TGrowthTags) => {
    setSelectedGrowth((prev) => {
      const exists = prev.includes(key);
      if (exists) {
        return prev.filter((k) => k !== key);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, key];
    });
  };

  const baseTagClass = 'h-10 flex items-center justify-center rounded-full border text-sm font-medium cursor-pointer transition-colors';
  const selectedClass = 'border-[#E95F45] text-[#E95F45] bg-[#FFE4D7]/60';
  const normalClass = 'border-black text-[#222] bg-white';
  const handleConfirm = () => {
    putProfile({
      experienceTags: selectedExperience,
      growthTags: selectedGrowth,
    });
    onClose();
  };

  return (
    <div className="px-10 py-8 flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <p className={titleStyle}>나의 프로필</p>
        <p className="text-sm font-normal text-[#8C8C8C]">면접에서 중점으로 피드백해드려요</p>
      </div>

      <div className={sectionStyle}>
        <p className={titleStyle}>경험 강조 분야</p>
        <div className="grid grid-cols-4 gap-x-4 gap-y-3">
          {(Object.entries(EXPERIENCE_TAG_LABELS) as [TExperienceTags, string][]).map(([key, label]) => {
            const isSelected = selectedExperience.includes(key);
            return (
              <button key={key} type="button" onClick={() => toggleExperience(key)} className={`${baseTagClass} ${isSelected ? selectedClass : normalClass}`}>
                {`# ${label}`}
              </button>
            );
          })}
        </div>
      </div>

      <div className={sectionStyle}>
        <p className={titleStyle}>발전 필요 역량</p>
        <div className="grid grid-cols-4 gap-x-4 gap-y-3">
          {(Object.entries(GROWTH_TAG_LABELS) as [TGrowthTags, string][]).map(([key, label]) => {
            const isSelected = selectedGrowth.includes(key);
            return (
              <button key={key} type="button" onClick={() => toggleGrowth(key)} className={`${baseTagClass} ${isSelected ? selectedClass : normalClass}`}>
                {`# ${label}`}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-3">
        <button type="button" className="h-11 px-7 rounded-2xl bg-[#F5F5F5] text-sm font-medium text-[#666666]" onClick={onClose}>
          취소
        </button>
        <button type="button" className="h-11 px-7 rounded-2xl bg-[#E95F45] text-sm font-medium text-white" onClick={handleConfirm}>
          확인
        </button>
      </div>
    </div>
  );
}
