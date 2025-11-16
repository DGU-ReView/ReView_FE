// src/pages/Interview/main_answer.tsx
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import InterviewLayout from '@/layouts/InterviewLayout';

import { uploadRecordingAndGetNext, sendTimeout } from '@/services/interviewApi';
import type { Question } from '@/services/interviewApi';

export default function AnswerQuestion() {
  const navigate = useNavigate();
  const location = useLocation() as {
    state?: {
      fileName?: string;
      jobTitle?: string;
      interviewType?: 'normal' | 'pressure';
      resumeKey?: string;
      sessionId?: string;
      firstQuestion?: Question;
      fromLoading?: boolean;
    };
  };

  const { fileName = '자소서', jobTitle, interviewType = 'normal', resumeKey, sessionId, firstQuestion } = location.state || {};

  /** ---------------- 상태 ---------------- */
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(firstQuestion ?? null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  // 탭(질문{order}) – 서버에서 오는 Question.order를 기반으로 생성/유지
  const [ordersSeen, setOrdersSeen] = useState<number[]>(firstQuestion ? [firstQuestion.order] : []);

  // 녹음 관련 상태
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [remainingTime, setRemainingTime] = useState(180);
  const [retryCount, setRetryCount] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const latestAudioBlobRef = useRef<Blob | null>(null);
  const timerRef = useRef<number | null>(null);

  // 재생
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);

  /** ---------------- 초기 유효성 ---------------- */
  useEffect(() => {
    if (!firstQuestion) {
      // question_loading에서 세션 생성 후 오도록 설계됨
      // 직접 접근 시엔 안정적으로 뒤로 돌림
      navigate('/question-loading', {
        replace: true,
        state: { fileName, jobTitle, interviewType, resumeKey },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** ---------------- 타이머 ---------------- */
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
        setRemainingTime((prev) => {
          if (prev <= 1) {
            stopRecording();
            // 현재 스펙에선 sendTimeout이 nextQuestion을 돌려주지 않으므로 완료 처리
            if (currentQuestion?.questionId) {
              void handleTimeout(currentQuestion.questionId);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRecording, isPaused, currentQuestion?.questionId]);

  /** ---------------- 녹음 제어 ---------------- */
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      latestAudioBlobRef.current = null;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        latestAudioBlobRef.current = audioBlob;

        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(audioUrl);

        // 재생 상태 초기화
        setIsPlaying(false);
        setPlaybackTime(0);

        // 스트림 정리
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);
      setRecordedAudioUrl(null);

      // 타이머 초기화
      setRecordingTime(0);
      setRemainingTime(180);
    } catch (error) {
      console.error('마이크 접근 오류:', error);
      alert('마이크 접근 권한이 필요합니다.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        /* noop */
      }
      setIsRecording(false);
      setIsPaused(false);
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
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
      // 재생 중이면 멈춤
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsPlaying(false);
      setPlaybackTime(0);
      setPlaybackDuration(0);

      setRecordedAudioUrl(null);
      setRecordingTime(0);
      setRemainingTime(180);
      setRetryCount((c) => c - 1);
      void startRecording();
    }
  };

  /** ---------------- 재생 제어 ---------------- */
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

  /** ---------------- 다음 질문 ---------------- */
  const resetForNext = () => {
    // 재생/녹음 상태 초기화
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
    setRemainingTime(180);
    setRetryCount(1);
  };

  const applyNext = (next: Question | null) => {
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

    setIsSubmitting(true);
    try {
      const next = await uploadRecordingAndGetNext(currentQuestion.questionId, latestAudioBlobRef.current);
      resetForNext();
      applyNext(next);
    } catch (e) {
      console.error('다음 질문 처리 실패:', e);
      alert('녹음 처리에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTimeout = async (questionId: string) => {
    try {
      await sendTimeout(questionId);
      // 현재 스펙에선 sendTimeout이 다음 질문을 주지 않으므로 종료 처리
      resetForNext();
      setShowCompleteModal(true);
    } catch (e) {
      console.error('시간초과 처리 실패:', e);
      alert('시간초과 처리에 실패했습니다.');
    }
  };

  /** ---------------- 탭 이동(보여주기 용도) ---------------- */
  const handleOrderTabClick = (order: number) => {
    void order;
    // 서버가 특정 order의 질문을 다시 불러오는 API를 제공하지 않음,.
    // 탭은 보여주기 용도로 유지. (실제 질문 이동은 서버 응답에 따라갈 것)
    // 필요 시 여기서 과거 질문 로깅/캐싱 구현 가능.
  };

  /** ---------------- 기타 ---------------- */
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

  return (
    <InterviewLayout activeMenu="answer">
      <div className="flex-1 flex flex-col px-8 pt-2 max-w-[800px]">
        {/* 상단 정보 */}
        <div className="mb-4">
          <span className="inline-block bg-gray-400 text-white px-4 py-1 rounded-full text-sm">{fileName}</span>
          <p className="text-gray-600 text-md mt-3">제한 시간 내에 면접질문에 답변해주세요.</p>
        </div>

        {/* 질문 탭(표시용: order) */}
        <div className="flex gap-2 mb-6">
          {ordersSeen.map((o) => (
            <button
              key={o}
              onClick={() => handleOrderTabClick(o)}
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
            <img src="src/assets/clockFrog.svg" alt="면접관" className="w-48 h-auto" />
          </div>

          {/* 타이머 & 녹음 컨트롤 */}
          <div className="max-w-[600px] mx-auto">
            {/* 타이머 */}
            <div className="mb-4">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-coral-500 transition-all duration-300" style={{ width: `${(remainingTime / 180) * 100}%` }} />
              </div>
              <p className="text-center text-sm text-gray-500 mt-2">
                {remainingTime > 0 ? `답변 가능 시간이 ${remainingTime}초 남았습니다 ...` : '시간이 종료되었습니다.'}
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
              <img src="src/assets/orangeFrog.svg" alt="완료" className="w-24 h-auto mx-auto" />
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-8">모든 질문에 완벽히 답했어요!</p>
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
        .text-coral-500 { color: #ff7f66; }
        .border-coral-500 { border-color: #ff7f66; }
        .hover\\:bg-coral-500:hover { background-color: #ff7f66; }
        .hover\\:bg-coral-50:hover { background-color: #fff5f5; }
        .hover\\:bg-coral-600:hover { background-color: #ff6b52; }
      `}</style>
    </InterviewLayout>
  );
}
