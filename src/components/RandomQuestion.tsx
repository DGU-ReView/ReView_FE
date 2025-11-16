// src/components/RandomQuestion.tsx
import { useEffect, useRef, useState } from 'react';
import {
  getRandomQuestion,
  subscribeToNotifications,
  uploadFeedbackRecordingAndGetResult,
  type IRandomQuestion,
  type IRandomNotificationPayload,
} from '@/services/randomQuestionApi';

type TNotification = IRandomNotificationPayload;

export default function RandomQuestion() {
  const [showPopup, setShowPopup] = useState(false);
  const [notification, setNotification] = useState<TNotification | null>(null);
  const [questionDetail, setQuestionDetail] = useState<IRandomQuestion | null>(null);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  // 제출 중 상태
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ===== SSE로 랜덤 팝업 알림 구독 =====
  useEffect(() => {
    const eventSource = subscribeToNotifications(
      async (event) => {
        try {
          const data = JSON.parse(event.data) as TNotification;
          // SSE로 알림이 오면 팝업을 띄우고, 해당 peerFeedbackId로 질문 조회
          setNotification(data);
          setShowPopup(true);
          setErrorMessage(null);
          setQuestionDetail(null);
          setRecordingTime(0);
          setRecordedAudio((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return null;
          });
          latestAudioBlobRef.current = null;

          setLoadingQuestion(true);
          const q = await getRandomQuestion(data.peerFeedbackId);
          setQuestionDetail(q);
        } catch (err) {
          console.error('랜덤 팝업 질문 처리 중 오류:', err);
          setErrorMessage('팝업 질문을 불러오지 못했습니다.');
        } finally {
          setLoadingQuestion(false);
        }
      },
      (error) => {
        console.error('SSE 연결 오류:', error);
      },
    );

    return () => {
      eventSource.close();
    };
  }, []);

  // ===== 유틸 =====
  const formatTime = (s: number) => {
    const secs = Math.max(0, Math.floor(s || 0));
    const m = Math.floor(secs / 60);
    const r = secs % 60;
    return `${m}:${r.toString().padStart(2, '0')}`;
  };

  // ===== 녹음 타이머 =====
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

  // ===== 녹음 제어 =====
  const startRecording = async () => {
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

        // 스트림 종료
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
    void startRecording();
  };

  // ===== 재생 제어 =====
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

  // ===== 오디오 이벤트 =====
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

  // ===== 팝업 닫기 =====
  const handleClose = () => {
    if (isRecording) stopRecording();
    if (audioRef.current) audioRef.current.pause();
    setShowPopup(false);
  };

  // ===== 답변 제출 (녹음 업로드 + 피드백 생성) =====
  const handleSubmit = async () => {
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

      // 일단은 간단히 alert로 AI 피드백만 보여주기
      alert(`AI 피드백이 도착했어요.\n\n${feedback.aiFeedback}`);

      // 필요하면 여기에서 feedback.selfFeedback 등도 활용 가능
      setShowPopup(false);
    } catch (err) {
      console.error('랜덤 팝업 답변 제출 실패:', err);
      alert('답변 제출에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 정리
  useEffect(() => {
    return () => {
      if (recordedAudio) URL.revokeObjectURL(recordedAudio);
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [recordedAudio]);

  if (!showPopup) return null;

  const playbackPercent = playbackDuration > 0 ? Math.min(100, Math.max(0, (playbackTime / playbackDuration) * 100)) : 0;

  // 진행바는 한 개 질문이라 100%로 고정(디자인 유지용)
  const progress = 100;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 shadow-lg w-full max-w-md mx-4 relative">
        {/* 닫기 */}
        <button onClick={handleClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors" aria-label="닫기">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* 헤더 - 알림 정보 */}
        <p className="text-sm text-gray-500 mb-1">
          {notification ? `${notification.jobName} · ${notification.interviewName} · 질문 ${notification.questionNumber}번` : '랜덤 팝업 질문'}
        </p>
        <h3 className="text-xl font-semibold text-gray-700 mb-4 text-center">랜덤 팝업 질문이 도착했어요 🔔</h3>

        {/* 질문/맥락 */}
        {loadingQuestion ? (
          <p className="text-center text-gray-500 mb-8">질문을 불러오는 중입니다...</p>
        ) : errorMessage ? (
          <p className="text-center text-red-500 mb-8">{errorMessage}</p>
        ) : questionDetail ? (
          <>
            {/* 맥락이 되는 질문 + STT */}
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <p className="text-xs font-semibold text-gray-500 mb-1">맥락이 되는 질문</p>
              <p className="text-sm text-gray-700 mb-2">{questionDetail.context.questionText}</p>
              {questionDetail.context.sttText && <p className="text-xs text-gray-500 whitespace-pre-line">{questionDetail.context.sttText}</p>}
            </div>

            {/* 실제 답변해야 할 질문 */}
            <p className="text-gray-700 text-center mb-8">{questionDetail.question.questionText}</p>
          </>
        ) : (
          <p className="text-center text-gray-500 mb-8">질문 정보를 불러오지 못했습니다.</p>
        )}

        {/* 이미지 */}
        <div className="flex justify-center mb-8">
          <img src="src/assets/clockFrog.svg" alt="면접관" className="w-32 h-auto" />
        </div>

        {/* 질문 진행바 (디자인 유지용) */}
        <div className="mb-4">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-coral-500 transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-center text-sm text-gray-500 mt-2">랜덤 팝업 질문</p>
        </div>

        {/* 녹음 / 재생 영역 */}
        <div className="bg-gray-100 rounded-2xl p-6 mb-6">
          {!recordedAudio ? (
            // === 녹음 UI ===
            <div className="flex items-center justify-center gap-4">
              {!isRecording ? (
                // 시작 버튼 (마이크 아이콘)
                <button
                  onClick={startRecording}
                  className="w-12 h-12 bg-coral-500 hover:bg-coral-600 rounded-full flex items-center justify-center shadow-md transition-colors"
                  aria-label="녹음 시작"
                >
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                  </svg>
                </button>
              ) : (
                <>
                  {/* 일시정지/재개 */}
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

                  {/* 녹음 시간 */}
                  <span className="text-lg font-semibold text-coral-500">{formatTime(recordingTime)}</span>

                  {/* 정지 */}
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
            // === 재생 UI ===
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

        {/* 버튼 그룹 */}
        <div className="flex justify-between items-center">
          <button
            onClick={handleRetry}
            className="bg-white border border-coral-500 text-coral-500 px-6 py-2 rounded-full text-sm font-medium hover:bg-coral-50 transition-colors"
          >
            다시 녹음하기
          </button>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !latestAudioBlobRef.current || !!errorMessage || loadingQuestion}
            className={`px-6 py-3 rounded-xl text-sm font-medium shadow-md transition-colors ${
              isSubmitting || !latestAudioBlobRef.current || !!errorMessage || loadingQuestion
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
  );
}
