import { useEffect, useRef, useState } from 'react';

import useGetOtherInterview from '@/hooks/useGetOtherInterview';
import usePostOtherInterview from '@/hooks/usePostOtherInterview';

import CustomInput from '@/components/common/CustomInput';
import FormTitle from '@/components/common/FormTitle';

import O from '@/assets/o.svg?react';
import X from '@/assets/x.svg?react';

const MIN_CHARS = 100;
const REQUIRED_SECONDS = 90;

export default function EvaluateStart() {
  const { data } = useGetOtherInterview();
  const { mutate } = usePostOtherInterview();

  const [evaluateText, setEvaluateText] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [elapsedSec, setElapsedSec] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSec((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (!audio.duration) return;
      setProgress((audio.currentTime / audio.duration) * 100);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(100);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [data?.result.recordingUrl]);
  const getCharCount = (text: string) => [...text].length;

  const evaluateChars = getCharCount(evaluateText);
  const isLengthOk = evaluateChars >= MIN_CHARS;

  const isTimeOk = elapsedSec >= REQUIRED_SECONDS;
  const canSubmit = isLengthOk && isTimeOk;

  const handleSubmit = () => {
    if (!canSubmit) return;

    mutate({
      recordingId: data?.result.recordingId ?? 0,
      body: evaluateText,
      followUpQuestion: questionText,
    });
  };
  const handleTogglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="flex gap-20 w-full min-h-full p-20">
      <div className="flex flex-col gap-4 shrink-0">
        <p className="font-bold text-3xl">EVALUATE</p>
        <p className="font-extralight text-4xl">타인의 면접 봐주기,</p>
      </div>

      <div className="w-full bg-[#EEEDF2] rounded-[20px] shadow-[0_7px_24px_0_#24262b44] h-full p-8 flex flex-col gap-8">
        <section className="bg-white rounded-[20px] p-5 font-normal text-sm">이 사용자는 {data?.result.jobRole} 직무를 목표로 준비 중인 면접자입니다.</section>
        <section className="flex flex-col gap-8">
          <FormTitle text={data?.result.question ?? ''} />
          {data?.result.recordingUrl && (
            <>
              <audio ref={audioRef} src={data.result.recordingUrl} preload="metadata" />

              <button type="button" onClick={handleTogglePlay} className="h-13 w-full rounded-[20px] bg-[#E95F45] px-6 flex items-center gap-6">
                <div className="flex items-center justify-center rounded-full border-4 border-white w-8 h-8">
                  <span className="text-white text-sm leading-none">{isPlaying ? '❚❚' : '▶'}</span>
                </div>
                <div className="flex-1 h-1 rounded-full bg-white/50 overflow-hidden">
                  <div className="h-full bg-white transition-[width] duration-150" style={{ width: `${progress}%` }} />
                </div>
              </button>
            </>
          )}
          <div className="flex flex-col gap-3 bg-white rounded-[20px] p-5 font-normal text-sm">
            <p className="text-xs font-normal text-[#8D8D8D]">{data?.result.jobRole} 직무 사용자의 답변</p>
            {data?.result.sttText}
          </div>
        </section>
        <section className="flex flex-col gap-8">
          <FormTitle text="평가 입력하기" />
          <CustomInput placeholder="평가를 입력해주세요" value={evaluateText} onChange={setEvaluateText} />
        </section>
        <section className="flex flex-col gap-8">
          <FormTitle text="질문 입력하기 (선택)" />
          <CustomInput placeholder="30자 이내의 질문을 입력해주세요" value={questionText} onChange={setQuestionText} />
        </section>
        <section className="flex flex-col gap-8">
          <FormTitle text="평가 조건 충족 여부" />
          <div className="w-full flex gap-2">
            <div className="w-full h-10 px-4 flex items-center justify-between bg-white text-sm font-normal rounded-[20px]">
              <p>평가 글자수</p>
              <div className="flex items-center gap-2">
                <p className="text-xs">
                  {evaluateChars} / {MIN_CHARS} 자
                </p>
                {isLengthOk ? <O className="size-5" /> : <X className="size-5" />}
              </div>
            </div>
            <div className="w-full h-10 px-4 flex items-center justify-between bg-white font-normal text-sm rounded-[20px]">
              <p className="text-sm">페이지에 머문 시간</p>
              <div className="flex items-center gap-2">
                <p className="text-xs">
                  {Math.min(elapsedSec, REQUIRED_SECONDS)} / {REQUIRED_SECONDS}s
                </p>
                {isTimeOk ? <O className="size-5" /> : <X className="size-5" />}
              </div>
            </div>
          </div>
        </section>
        <button
          className={`self-end h-13 mt-10 w-50 rounded-lg text-white font-semibold
            ${canSubmit ? 'bg-[#E95F45] cursor-pointer' : 'bg-[#D5D5D5] cursor-not-allowed'}`}
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          제출하기
        </button>
      </div>
    </div>
  );
}
