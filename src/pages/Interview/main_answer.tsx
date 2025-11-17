// src/pages/Interview/main_answer.tsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import InterviewLayout from '@/layouts/InterviewLayout';
import type { IQuestion } from '@/services/interviewApi';
import { uploadRecordingAndGetNext, timeoutAndGetNextQuestion } from '@/services/interviewApi';

import clockFrog from '@/assets/clockFrog.svg';
import orangeFrog from '@/assets/orangeFrog.svg';
import frog from '@/assets/frog.svg';

const INITIAL_TIME = 30; // 녹음 시작 전 제한 시간
const RECORDING_TIME = 80; // 녹음 후 전체 시간

export default function AnswerQuestion() {
  const navigate = useNavigate();
  const location = useLocation() as {
    state?: {
      fileName?: string;
      jobTitle?: string;
      interviewType?: 'normal' | 'pressure';
      resumeKey?: string;
      sessionId?: string;
      firstQuestion?: IQuestion;
      fromLoading?: boolean;
    };
  };

  const { fileName = '자소서', jobTitle, interviewType = 'normal', resumeKey, sessionId, firstQuestion } = location.state || {};

  const [currentQuestion, setCurrentQuestion] = useState<IQuestion | null>(firstQuestion ?? null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  const [ordersSeen, setOrdersSeen] = useState<number[]>(firstQuestion ? [firstQuestion.order] : []);

  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);

  const [remainingTime, setRemainingTime] = useState(INITIAL_TIME);
  const [hasStartedRecording, setHasStartedRecording] = useState(false); // 녹음을 시작했는지 여부

  const [retryCount, setRetryCount] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const latestAudioBlobRef = useRef<Blob | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  
  // 남은 시간이 줄어들어야 하는지 여부:
  // - 질문 노출 & 완료모달 아님 & 남은시간 > 0
  // - (녹음 중) 또는 (아직 녹음본이 없음 = 최초 진입 상태)
  // - 재생 중(isPlaying)에는 줄어들면 안 됨
  const shouldTick = !!currentQuestion && !showCompleteModal && remainingTime > 0 && (isRecording || (!recordedAudioUrl && !isPlaying));

  useEffect(() => {
    if (!firstQuestion) {
      navigate('/question-loading', {
        replace: true,
        state: { fileName, jobTitle, interviewType, resumeKey },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetForNext() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setPlaybackTime(0);
    setPlaybackDuration(0);
    setRecordedAudioUrl(null);
    latestAudioBlobRef.current = null;
    setRecordingTime(0);

    setRemainingTime(INITIAL_TIME); // 다음 질문에서 초기화
    setHasStartedRecording(false); // 녹음 시작 여부 초기화
    setRetryCount(1);
  }

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
      setIsRecording(false);
      setIsPaused(false);
      // ⛔ 정지 후에는 카운트다운이 더 줄지 않음(useEffect로 interval이 중단됨)
    }
  }, [isRecording]);

  const handleTimeout = useCallback(
    async (questionId: string) => {
      try {
        const next = await timeoutAndGetNextQuestion(questionId);
        alert('시간초과로 답변하지 못했습니다. 다음 질문으로 넘어갑니다.');
        resetForNext();
        applyNext(next);
      } catch (e) {
        console.error('시간초과 처리 실패:', e);
        alert('시간이 초과되었습니다. 다음 질문으로 넘어갑니다.');
        resetForNext();
        applyNext(null);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // ⏱ 녹음 시간(녹음 중에만 증가)
  useEffect(() => {
    if (isRecording && !isPaused) {
      const id = window.setInterval(() => setRecordingTime((prev) => prev + 1), 1000);
      return () => clearInterval(id);
    }
    return undefined;
  }, [isRecording, isPaused]);

  // ✅ 카운트다운: 최초 진입(아직 녹음본 없음)에도 감소,
  //    녹음 중에도 감소, 재생 중/정지 후에는 멈춤
  useEffect(() => {
    if (!currentQuestion) return;

    let id: number | null = null;

    if (shouldTick) {
      id = window.setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            if (id) clearInterval(id);

            // 시간 끝나면 녹음 중지 + 서버 timeout 처리
            if (isRecording) {
              try {
                mediaRecorderRef.current?.stop();
              } catch {}
            }

            if (currentQuestion?.questionId) {
              void handleTimeout(currentQuestion.questionId);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (id) clearInterval(id);
    };
  }, [shouldTick, currentQuestion?.questionId, isRecording, handleTimeout]);

  const startRecording = async () => {
    try {
      // 녹음 시작 시 전체 시간을 80초로 변경
      if (!hasStartedRecording) {
        setRemainingTime(RECORDING_TIME);
        setHasStartedRecording(true);
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      latestAudioBlobRef.current = null;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        latestAudioBlobRef.current = audioBlob;

        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(audioUrl);

        setIsPlaying(false);
        setPlaybackTime(0);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);
      setRecordedAudioUrl(null);
      setRecordingTime(0);
      // ⏱ 남은 시간은 녹음 중일 때만 줄어듦
    } catch (error) {
      console.error('마이크 접근 오류:', error);
      alert('마이크 접근 권한이 필요합니다.');
    }
  };

  const togglePause = () => {
    if (!mediaRecorderRef.current) return;
    if (isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    } else {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  };

  const handleRetry = () => {
    if (retryCount > 0) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsPlaying(false);
      setPlaybackTime(0);
      setPlaybackDuration(0);

      // 이전 녹음 데이터 완전히 제거
      if (recordedAudioUrl) {
        URL.revokeObjectURL(recordedAudioUrl);
      }
      setRecordedAudioUrl(null);
      setRecordingTime(0);

      // 🔧 중요: 이전 오디오 blob 초기화
      latestAudioBlobRef.current = null;
      audioChunksRef.current = [];

      // ✅ 다시 녹음하기: 시간 초기화
      setRemainingTime(RECORDING_TIME);

      setRetryCount((c) => c - 1);
      void startRecording();
    }
  };

  const toggleAudioPlayback = () => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      const dur = isFinite(audio.duration) ? audio.duration : recordingTime || 0;
      setPlaybackDuration(Math.floor(dur));
      setPlaybackTime(Math.floor(audio.currentTime || 0));
    };
    const handleTimeUpdate = () => setPlaybackTime(Math.floor(audio.currentTime || 0));
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setPlaybackTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    if (audio.readyState >= 1) handleLoadedMetadata();

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [recordedAudioUrl, recordingTime]);

  const applyNext = (next: IQuestion | null) => {
    if (!next) {
      setShowCompleteModal(true);
      return;
    }
    setCurrentQuestion(next);
    setOrdersSeen((prev) => (prev.includes(next.order) ? prev : [...prev, next.order].sort((a, b) => a - b)));
  };

  const handleNext = async () => {
    if (!currentQuestion?.questionId) return;
    if (!latestAudioBlobRef.current) {
      alert('답변을 녹음해주세요.');
      return;
    }

    // 중복 제출 방지
    if (isSubmitting) {
      console.log('이미 제출 중입니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      const next = await uploadRecordingAndGetNext(currentQuestion.questionId, latestAudioBlobRef.current);
      resetForNext();
      applyNext(next);
    } catch (e: any) {
      console.error('다음 질문 처리 실패:', e);

      // 에러 타입별 처리
      if (e?.response?.data?.errorCode === 'ALREADY_IN_QUEUE_OR_DONE') {
        alert('이미 처리된 녹음입니다. 다음 질문으로 넘어갑니다.');
        // 다음 질묬을 가져오기 위해 재시도
        try {
          // timeout 처리로 다음 질묬 가져오기
          const next = await timeoutAndGetNextQuestion(currentQuestion.questionId);
          resetForNext();
          applyNext(next);
        } catch (err) {
          console.error('다음 질묬 조회 실패:', err);
          alert('다음 질묬으로 넘어갑니다.');
          resetForNext();
          applyNext(null);
        }
      } else {
        alert('녹음 처리에 실패했습니다. 잠시 후 다시 시도해주세요.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalFeedback = () => {
    if (sessionId) {
      navigate('/feedback-result', { state: { sessionId } });
    } else {
      navigate('/feedback-result');
    }
  };

  const formatTime = (seconds: number) => {
    const s = Math.max(0, Math.floor(seconds || 0));
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const playbackPercent = playbackDuration > 0 ? Math.min(100, Math.max(0, (playbackTime / playbackDuration) * 100)) : 0;

  // 이미지 선택: 30초 이하면 clockFrog, 아니면 frog
  const currentImage = remainingTime <= 30 ? clockFrog : frog;

  // 빨간 오버레이 opacity 계산 (30초 이하일 때만)
  const redOverlayOpacity = remainingTime <= 30 ? Math.min(0.3, (30 - remainingTime) / 30 * 0.3) : 0;

  // 진행바 색상 (녹음 시작 전: 파란색, 녹음 후: coral)
  const progressBarColor = hasStartedRecording ? 'bg-coral-500' : 'bg-blue-500';

  // 최대 시간 (진행바 계산용)
  const maxTime = hasStartedRecording ? RECORDING_TIME : INITIAL_TIME;

  return (
    <InterviewLayout activeMenu="answer">
      {/* 빨간 오버레이 */}
      {redOverlayOpacity > 0 && (
        <div 
          className="fixed inset-0 bg-red-500 pointer-events-none z-10"
          style={{ opacity: redOverlayOpacity }}
        />
      )}
      <div className="flex-1 flex flex-col px-8 pt-2 max-w-[800px] relative z-20">
        {/* 상단 정보 */}
        <div className="mb-4">
          <span className="inline-block bg-gray-400 text-white px-4 py-1 rounded-full text-sm">{fileName}</span>
          <p className="text-gray-600 text-md mt-3">제한 시간 내에 면접질문에 답변해주세요.</p>
        </div>

        {/* 질문 탭 */}
        <div className="flex gap-2 mb-6">
          {ordersSeen.map((o) => (
            <button
              key={o}
              onClick={() => {}}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                currentQuestion?.order === o
                  ? 'bg-white border-2 border-coral-500 text-coral-500'
                  : 'bg-white border border-gray-300 text-gray-500 hover:border-gray-400'
              }`}
            >
              질문{o}
            </button>
          ))}
        </div>

        {/* 질문 카드 */}
        <div className="bg-white rounded-2xl p-8 shadow-sm mb-6 flex-1">
          <h3 className="text-xl font-semibold text-gray-700 mb-6 text-center">{currentQuestion ? `질문${currentQuestion.order}` : '질문'}</h3>
          <div className="border-t border-gray-200 pt-6" />

          <p className="text-gray-700 text-center mb-8">
            {currentQuestion?.mainQuestion}
            {currentQuestion?.subQuestion ? ` — ${currentQuestion.subQuestion}` : ''}
          </p>

          {/* 캐릭터 이미지 */}
          <div className="flex justify-center mb-8">
            <img src={currentImage} alt="면접관" className="w-48 h-auto" />
          </div>

          {/* 타이머 & 녹음 컨트롤 */}
          <div className="max-w-[600px] mx-auto">
            {/* 타이머 */}
            <div className="mb-4">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className={`h-full ${progressBarColor} transition-all duration-300`} style={{ width: `${(remainingTime / maxTime) * 100}%` }} />
              </div>
              <p className="text-center text-sm text-gray-500 mt-2">
                {!hasStartedRecording ? (
                  remainingTime > 0 ? `녹음을 시작하세요 (${remainingTime}초)` : '시간이 종료되었습니다.'
                ) : (
                  remainingTime > 0 ? `답변 가능 시간이 ${remainingTime}초 남았습니다 ...` : '시간이 종료되었습니다.'
                )}
              </p>
            </div>

            {/* 녹음 컨트롤 */}
            {!recordedAudioUrl ? (
              <div className="bg-gray-100 rounded-2xl p-6 mb-6">
                <div className="flex items-center justify-center gap-4">
                  {!isRecording ? (
                    <button
                      onClick={startRecording}
                      className="w-16 h-16 bg-coral-500 hover:bg-coral-600 rounded-full flex items-center justify-center shadow-md transition-colors"
                    >
                      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                      </svg>
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={togglePause}
                        className="w-12 h-12 bg-yellow-500 hover:bg-yellow-600 rounded-full flex items-center justify-center shadow-md transition-colors"
                      >
                        {isPaused ? (
                          <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        ) : (
                          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                          </svg>
                        )}
                      </button>

                      <span className="text-2xl font-bold text-coral-500">{formatTime(recordingTime)}</span>

                      <button
                        onClick={stopRecording}
                        className="w-12 h-12 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-md transition-colors"
                      >
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6 6h12v12H6z" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              // 재생 UI
              <div className="bg-gray-100 rounded-2xl p-6 mb-6">
                <div className="flex items-center gap-4">
                  <button
                    onClick={toggleAudioPlayback}
                    className="w-12 h-12 bg-coral-500 hover:bg-coral-600 rounded-full flex items-center justify-center shadow-md transition-colors flex-shrink-0"
                  >
                    {isPlaying ? (
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </button>

                  <div className="flex-1">
                    <div className="h-2 bg-gray-300 rounded-full overflow-hidden">
                      <div className="h-full bg-coral-500 rounded-full transition-all duration-150" style={{ width: `${playbackPercent}%` }} />
                    </div>
                  </div>

                  <span className="text-sm text-gray-600 font-medium flex-shrink-0">
                    {formatTime(playbackTime)} / {formatTime(playbackDuration)}
                  </span>
                </div>
                <audio ref={audioRef} src={recordedAudioUrl || ''} preload="metadata" />
              </div>
            )}

            {/* 다시 녹음하기 */}
            {recordedAudioUrl && (
              <div className="flex justify-center mb-6">
                <button
                  onClick={handleRetry}
                  disabled={retryCount === 0}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                    retryCount > 0
                      ? 'bg-white border border-coral-500 text-coral-500 hover:bg-coral-50'
                      : 'bg-gray-200 border border-gray-300 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  다시 녹음하기 ({retryCount}회)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 다음 버튼 */}
        <div className="flex justify-end pb-4">
          <button
            onClick={handleNext}
            disabled={!recordedAudioUrl || isSubmitting || !currentQuestion?.questionId}
            className={`px-8 py-3 rounded-lg font-medium transition-colors ${
              recordedAudioUrl && !isSubmitting ? 'bg-coral-400 hover:bg-coral-500 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? '처리 중...' : '다음'}
          </button>
        </div>
      </div>

      {/* 완료 모달 */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-12 max-w-md w-full mx-4 text-center">
            <div className="mb-6">
              <img src={orangeFrog} alt="완료" className="w-24 h-auto mx-auto" />
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-8">면접이 완료되었어요!</p>
            <button onClick={handleFinalFeedback} className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-3 rounded-lg font-medium transition-colors">
              최종 피드백 확인
            </button>
          </div>
        </div>
      )}

      <style>{`
        .bg-coral-50 { background-color: #fff5f5; }
        .bg-coral-400 { background-color: #ff9580; }
        .bg-coral-500 { background-color: #ff7f66; }
        .bg-coral-600 { background-color: #ff6b52; }
        .bg-blue-500 { background-color: #3b82f6; }
        .text-coral-500 { color: #ff7f66; }
        .border-coral-500 { border-color: #ff7f66; }
        .hover\\:bg-coral-500:hover { background-color: #ff7f66; }
        .hover\\:bg-coral-50:hover { background-color: #fff5f5; }
        .hover\\:bg-coral-600:hover { background-color: #ff6b52; }
      `}</style>
    </InterviewLayout>
  );
}
