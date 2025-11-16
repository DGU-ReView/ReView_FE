// src/components/RandomQuestion.tsx
import { useEffect, useRef, useState } from 'react';
import {
  getRandomQuestion,
  subscribeToNotifications,
  uploadFeedbackRecordingAndGetResult,
  type IRandomQuestion,
  type IRandomNotificationPayload,
} from '@/services/randomQuestionApi';
import clockFrog from '@/assets/clockFrog.svg';

type TNotification = IRandomNotificationPayload;
const MAX_TIME = 180;
const isDev = import.meta.env.DEV;

// 🔎 알림 페이로드에서 id를 안전하게 뽑아오기 (peerAnswerId 우선, 없으면 peerFeedbackId)
const extractPeerAnswerId = (payload: any): number | null => {
  const raw = payload?.peerAnswerId ?? payload?.peerFeedbackId;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
};

export default function RandomQuestion() {
  const [showPopup, setShowPopup] = useState(false);
  const [notification, setNotification] = useState<TNotification | null>(null);
  const [questionDetail, setQuestionDetail] = useState<IRandomQuestion | null>(null);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ===== 타이머 상태 =====
  const [remainingTime, setRemainingTime] = useState<number>(MAX_TIME);
  const countdownTimerRef = useRef<number | null>(null);

  // ===== 녹음 상태 =====
  const [isRecording, setIsRecording] = useState(false);
  const [isPausedRec, setIsPausedRec] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recordTimerRef = useRef<number | null>(null);
  const latestAudioBlobRef = useRef<Blob | null>(null);

  // ===== 재생 상태 =====
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // ===== SSE & 요청 취소 컨트롤 =====
  const esRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const attemptsRef = useRef(0);
  const fetchAbortRef = useRef<AbortController | null>(null);

  const shouldTickPopup = showPopup && remainingTime > 0 && (isRecording || (!recordedAudio && !isPlaying));

  const clearReconnectTimer = () => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  };

  const scheduleReconnect = (why: string) => {
    if (reconnectTimerRef.current) return;
    const wait = Math.min(30000, 1000 * Math.pow(2, attemptsRef.current));
    attemptsRef.current += 1;
    console.warn(`[SSE] reconnect in ${wait}ms (${why})`);
    reconnectTimerRef.current = window.setTimeout(() => {
      reconnectTimerRef.current = null;
      openSSE();
    }, wait);
  };

  const closeSSE = () => {
    clearReconnectTimer();
    if (esRef.current) {
      try {
        esRef.current.close();
      } catch {}
      esRef.current = null;
    }
  };

  // ✅ 스펙에 맞춰 peerAnswerId로만 호출 (옵션객체 제거해 TS 오류 방지)
  const fetchRandomQuestion = async (peerAnswerId: number) => {
    fetchAbortRef.current?.abort();
    fetchAbortRef.current = new AbortController();

    setLoadingQuestion(true);
    setErrorMessage(null);

    try {
      const q = await getRandomQuestion(peerAnswerId);
      setQuestionDetail(q);
    } catch (err: any) {
      if (err?.name === 'CanceledError' || err?.name === 'AbortError') {
        // ignore
      } else if (err?.response?.data?.errorCode === 'PEER_FEEDBACK_NOT_FOUND') {
        setErrorMessage('해당 피드백 정보를 찾을 수 없습니다.\n다른 peerAnswerId를 시도해주세요.');
      } else if (err?.response?.data?.errorCode === 'INTERNAL_ERROR') {
        setErrorMessage('서버 내부 오류가 발생했습니다.\n잠시 후 다시 시도해주세요.');
      } else {
        setErrorMessage('팝업 질문을 불러오지 못했습니다.');
      }
    } finally {
      setLoadingQuestion(false);
    }
  };

  const handleMessage = async (event: MessageEvent) => {
    try {
      const parsed = JSON.parse(event.data);
      const id = extractPeerAnswerId(parsed);
      if (id == null) return;

      const data = parsed as TNotification;
      setNotification(data);
      setShowPopup(true);
      setQuestionDetail(null);

      setRecordedAudio((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      latestAudioBlobRef.current = null;
      setRecordingTime(0);
      setRemainingTime(MAX_TIME);

      await fetchRandomQuestion(id);
    } catch {
      // keepalive 등 무시
    }
  };

  const openSSE = () => {
    closeSSE();
    attemptsRef.current = 0;

    const es = subscribeToNotifications(handleMessage, (errorEvt) => {
      console.error('SSE 연결 오류:', errorEvt);
      scheduleReconnect('onerror');
    }) as unknown as EventSource;

    (es as any).onopen = () => {
      attemptsRef.current = 0;
      console.log('[SSE] opened');
    };

    esRef.current = es;
  };

  // 🔧 테스트 버튼
  const triggerTestPopup = async () => {
    const inputId = prompt('테스트할 peerAnswerId를 입력하세요 (Mock: -1):', '1');
    if (!inputId || inputId.trim() === '') {
      alert('peerAnswerId를 입력해주세요.');
      return;
    }
    const peerAnswerId = parseInt(inputId.trim(), 10);
    if (isNaN(peerAnswerId)) {
      alert('유효한 숫자를 입력해주세요.');
      return;
    }

    const testData: any = {
      jobName: '백엔드 개발자',
      interviewName: '테스트 면접',
      questionNumber: 1,
      peerAnswerId, // ✅ 스펙 필드명
    };

    setNotification(testData);
    setShowPopup(true);
    setQuestionDetail(null);

    if (recordedAudio) URL.revokeObjectURL(recordedAudio);
    latestAudioBlobRef.current = null;
    setRecordingTime(0);
    setRemainingTime(MAX_TIME);

    if (peerAnswerId === -1) {
      setLoadingQuestion(true);
      setTimeout(() => {
        setQuestionDetail({
          question: { questionId: 999, questionText: '그럼 이걸 실제 서비스에서 어떻게 검증했나요?' },
          context: {
            questionId: 998,
            questionText: '프로젝트에서 사용한 기술 스택에 대해 설명해주세요.',
            presignedRecordingGetUrl: '',
            sttText: '저희 프로젝트는 React와 TypeScript, 백엔드는 Spring Boot를 사용했습니다.',
          },
        });
        setLoadingQuestion(false);
      }, 500);
    } else {
      await fetchRandomQuestion(peerAnswerId);
    }
  };

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible') openSSE();
      else closeSSE();
    };
    openSSE();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      closeSSE();
      fetchAbortRef.current?.abort();
      if (recordedAudio) URL.revokeObjectURL(recordedAudio);
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatTime = (s: number) => {
    const secs = Math.max(0, Math.floor(s || 0));
    const m = Math.floor(secs / 60);
    const r = secs % 60;
    return `${m}:${r.toString().padStart(2, '0')}`;
  };

  // 🔁 카운트다운
  useEffect(() => {
    if (!shouldTickPopup) {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      return;
    }
    countdownTimerRef.current = window.setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          try {
            mediaRecorderRef.current?.stop();
          } catch {}
          setIsRecording(false);
          setIsPausedRec(false);
          if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
    };
  }, [shouldTickPopup]);

  const isTimeOver = remainingTime <= 0;

  // ⏱ 녹음 시간 타이머
  useEffect(() => {
    if (isRecording && !isPausedRec) {
      recordTimerRef.current = window.setInterval(() => setRecordingTime((t) => t + 1), 1000);
    } else if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    return () => {
      if (recordTimerRef.current) {
        clearInterval(recordTimerRef.current);
        recordTimerRef.current = null;
      }
    };
  }, [isRecording, isPausedRec]);

  const startRecording = async () => {
    if (isTimeOver) {
      alert('시간이 종료되어 더 이상 녹음할 수 없습니다.');
      return;
    }
    try {
      if (recordedAudio) {
        URL.revokeObjectURL(recordedAudio);
        setRecordedAudio(null);
      }
      latestAudioBlobRef.current = null;
      setPlaybackTime(0);
      setPlaybackDuration(0);
      setIsPlaying(false);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = () => {
        const mime = mediaRecorder.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: mime });
        latestAudioBlobRef.current = blob;
        const url = URL.createObjectURL(blob);
        setRecordedAudio(url);
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        setIsRecording(false);
        setIsPausedRec(false);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setIsPausedRec(false);
      setRecordingTime(0);
    } catch (err) {
      console.error('마이크 접근 오류:', err);
      alert('마이크 접근 권한이 필요합니다.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        setIsRecording(false);
        setIsPausedRec(false);
      }
    }
  };

  const togglePauseRec = () => {
    if (!mediaRecorderRef.current) return;
    if (isPausedRec) {
      mediaRecorderRef.current.resume();
      setIsPausedRec(false);
    } else {
      mediaRecorderRef.current.pause();
      setIsPausedRec(true);
    }
  };

  const handleRetry = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setPlaybackTime(0);
    setPlaybackDuration(0);
    if (recordedAudio) {
      URL.revokeObjectURL(recordedAudio);
      setRecordedAudio(null);
    }
    setRecordingTime(0);
    latestAudioBlobRef.current = null;
    audioChunksRef.current = [];
    setRemainingTime(MAX_TIME);
    void startRecording();
  };

  const toggleAudioPlayback = () => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      el.play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    } else {
      el.pause();
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onLoadedMeta = () => {
      setPlaybackDuration(Math.floor(isFinite(el.duration) ? el.duration : 0));
      setPlaybackTime(Math.floor(el.currentTime || 0));
    };
    const onTimeUpdate = () => setPlaybackTime(Math.floor(el.currentTime || 0));
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      setPlaybackTime(0);
    };
    el.addEventListener('loadedmetadata', onLoadedMeta);
    el.addEventListener('timeupdate', onTimeUpdate);
    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    el.addEventListener('ended', onEnded);
    if (el.readyState >= 1) onLoadedMeta();
    return () => {
      el.removeEventListener('loadedmetadata', onLoadedMeta);
      el.removeEventListener('timeupdate', onTimeUpdate);
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('ended', onEnded);
    };
  }, [recordedAudio]);

  const handleClose = () => {
    if (isRecording) stopRecording();
    if (audioRef.current) audioRef.current.pause();
    setShowPopup(false);
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  };

  const handleSubmit = async () => {
    if (isTimeOver) {
      alert('시간이 종료되어 답변을 제출할 수 없습니다.');
      return;
    }
    if (!questionDetail?.question?.questionId) {
      alert('질문 정보를 불러오지 못했습니다.');
      return;
    }
    if (!latestAudioBlobRef.current) {
      alert('먼저 답변을 녹음해주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      const feedback = await uploadFeedbackRecordingAndGetResult(questionDetail.question.questionId, latestAudioBlobRef.current);
      alert(`AI 피드백이 도착했어요.\n\n${feedback.aiFeedback}`);
      setShowPopup(false);
    } catch (err) {
      console.error('랜덤 팝업 답변 제출 실패:', err);
      alert('답변 제출에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const playbackPercent = playbackDuration > 0 ? Math.min(100, Math.max(0, (playbackTime / playbackDuration) * 100)) : 0;
  const progressPercent = Math.max(0, Math.min(100, (remainingTime / MAX_TIME) * 100));

  return (
    <>
      {isDev && (
        <button
          onClick={triggerTestPopup}
          className="fixed bottom-4 right-4 z-[60] bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow-lg font-medium text-sm"
        >
          랜덤 질문 테스트
        </button>
      )}

      {!showPopup ? null : (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 shadow-lg w-full max-w-md mx-4 relative">
            <button onClick={handleClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors" aria-label="닫기">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <p className="text-sm text-gray-500 mb-1">
              {notification
                ? `${(notification as any).jobName} · ${(notification as any).interviewName} · 질문 ${(notification as any).questionNumber}번`
                : '랜덤 팝업 질문'}
            </p>
            <h3 className="text-xl font-semibold text-gray-700 mb-4 text-center">랜덤 팝업 질문이 도착했어요 🔔</h3>

            {loadingQuestion ? (
              <p className="text-center text-gray-500 mb-8">질문을 불러오는 중입니다...</p>
            ) : errorMessage ? (
              <p className="text-center text-red-500 mb-8 whitespace-pre-line">{errorMessage}</p>
            ) : questionDetail ? (
              <>
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <p className="text-xs font-semibold text-gray-500 mb-1">맥락이 되는 질문</p>
                  <p className="text-sm text-gray-700 mb-2">{questionDetail.context.questionText}</p>
                  {questionDetail.context.sttText && <p className="text-xs text-gray-500 whitespace-pre-line">{questionDetail.context.sttText}</p>}
                </div>
                <p className="text-gray-700 text-center mb-8">{questionDetail.question.questionText}</p>
              </>
            ) : (
              <p className="text-center text-gray-500 mb-8">질문 정보를 불러오지 못했습니다.</p>
            )}

            <div className="flex justify-center mb-4">
              <img src={clockFrog} alt="면접관" className="w-32 h-auto" />
            </div>

            <p className="text-center text-sm text-gray-500 mb-4">
              {remainingTime > 0 ? `답변 가능 시간이 ${remainingTime}초 남았습니다.` : '시간이 종료되었습니다.'}
            </p>

            <div className="mb-4">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-coral-500 transition-all duration-300" style={{ width: `${progressPercent}%` }} />
              </div>
              <p className="text-center text-sm text-gray-500 mt-2">랜덤 팝업 질문</p>
            </div>

            <div className="bg-gray-100 rounded-2xl p-6 mb-6">
              {!recordedAudio ? (
                <div className="flex items-center justify-center gap-4">
                  {!isRecording ? (
                    <button
                      onClick={startRecording}
                      disabled={isTimeOver}
                      className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-colors ${
                        isTimeOver ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-coral-500 hover:bg-coral-600 text-white'
                      }`}
                      aria-label="녹음 시작"
                    >
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c1.66 0 3 1.34 3 3z" />
                        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                      </svg>
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={togglePauseRec}
                        className="w-12 h-12 bg-yellow-500 hover:bg-yellow-600 rounded-full flex items-center justify-center shadow-md transition-colors"
                        aria-label={isPausedRec ? '녹음 재개' : '녹음 일시정지'}
                      >
                        {isPausedRec ? (
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                          </svg>
                        )}
                      </button>
                      <span className="text-lg font-semibold text-coral-500">{formatTime(recordingTime)}</span>
                      <button
                        onClick={stopRecording}
                        className="w-12 h-12 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-md transition-colors"
                        aria-label="녹음 정지"
                      >
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6 6h12v12H6z" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <button
                    onClick={toggleAudioPlayback}
                    className="w-12 h-12 bg-coral-500 hover:bg-coral-600 rounded-full flex items-center justify-center shadow-md transition-colors flex-shrink-0"
                    aria-label={isPlaying ? '일시정지' : '재생'}
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
                  <audio ref={audioRef} src={recordedAudio || ''} preload="metadata" />
                </div>
              )}
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={handleRetry}
                className="px-6 py-2 rounded-full text-sm font-medium transition-colors bg-white border border-coral-500 text-coral-500 hover:bg-coral-50"
              >
                다시 녹음하기
              </button>

              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !latestAudioBlobRef.current || !!errorMessage || loadingQuestion || isTimeOver}
                className={`px-6 py-3 rounded-xl text-sm font-medium shadow-md transition-colors ${
                  isSubmitting || !latestAudioBlobRef.current || !!errorMessage || loadingQuestion || isTimeOver
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-coral-500 hover:bg-coral-600 text-white'
                }`}
              >
                {isSubmitting ? '피드백 생성 중...' : '답변 제출하고 피드백 받기'}
              </button>
            </div>
          </div>

          <style>{`
            .bg-coral-50 { background-color: #fff5f5; }
            .bg-coral-500 { background-color: #ff7f66; }
            .bg-coral-600 { background-color: #ff6b52; }
            .text-coral-500 { color: #ff7f66; }
            .border-coral-500 { border-color: #ff7f66; }
            .hover\\:bg-coral-50:hover { background-color: #fff5f5; }
            .hover\\:bg-coral-600:hover { background-color: #ff6b52; }
          `}</style>
        </div>
      )}
    </>
  );
}
