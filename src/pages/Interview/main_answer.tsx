import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import InterviewLayout from '@/layouts/InterviewLayout';
import {
  uploadRecordingAndGetNext,
  sendTimeout,
  NextQuestion,
} from '@/services/interviewApi';

interface QuestionData {
  questionId: number;
  questionText: string;
  rootId: number;
  rootText: string;
  rootIndex: number;
  type: 'ROOT' | 'FOLLOW_UP';
}

export default function AnswerQuestion() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    sessionId,
    firstQuestionId,
    firstQuestionText,
    resumeKey = '자소서',
  } = location.state || {};

  // 질문 관리
  const [currentQuestion, setCurrentQuestion] = useState<QuestionData | null>(null);
  const [questionHistory, setQuestionHistory] = useState<QuestionData[]>([]);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // 녹음 관련 상태
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [remainingTime, setRemainingTime] = useState(180); // 3분 = 180초
  const [retryCount, setRetryCount] = useState(1);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const isTimeoutProcessedRef = useRef(false);

  // 재생 관련 상태/참조
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);

  // 초기 질문 설정
  useEffect(() => {
    if (!sessionId || !firstQuestionId || !firstQuestionText) {
      alert('면접 세션 정보가 없습니다.');
      navigate('/upload');
      return;
    }

    const firstQuestion: QuestionData = {
      questionId: firstQuestionId,
      questionText: firstQuestionText,
      rootId: firstQuestionId,
      rootText: firstQuestionText,
      rootIndex: 1,
      type: 'ROOT',
    };

    setCurrentQuestion(firstQuestion);
    setQuestionHistory([firstQuestion]);
  }, [sessionId, firstQuestionId, firstQuestionText, navigate]);

  // 녹음 중지
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        setIsRecording(false);
        setIsPaused(false);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  // 타이머 시작/정지
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
        setRemainingTime((prev) => {
          if (prev <= 1) {
            stopRecording();
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
  }, [isRecording, isPaused]);

  // 시간 초과 처리
  useEffect(() => {
    if (remainingTime === 0 && !isTimeoutProcessedRef.current && currentQuestion) {
      isTimeoutProcessedRef.current = true;
      handleTimeout();
    }
  }, [remainingTime, currentQuestion]);

  // 녹음 시작
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudio(audioUrl);
        setRecordedBlob(audioBlob);

        // 재생 상태 초기화
        setIsPlaying(false);
        setPlaybackTime(0);

        // 스트림 정리
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);
      setRecordedAudio(null);
      setRecordedBlob(null);

      // 녹음 타이머 초기화
      setRecordingTime(0);
      setRemainingTime(180);
      isTimeoutProcessedRef.current = false;
    } catch (error) {
      console.error('마이크 접근 오류:', error);
      alert('마이크 접근 권한이 필요합니다.');
    }
  };

  // 녹음 일시정지/재개
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

  // 재녹음
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

      setRecordedAudio(null);
      setRecordedBlob(null);
      setRecordingTime(0);
      setRemainingTime(180);
      setRetryCount(retryCount - 1);
      isTimeoutProcessedRef.current = false;
      startRecording();
    }
  };

  // 오디오 재생/정지
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

  // 오디오 이벤트 연결
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      const dur = isFinite(audio.duration) ? audio.duration : recordingTime || 0;
      setPlaybackDuration(Math.floor(dur));
      setPlaybackTime(Math.floor(audio.currentTime || 0));
    };

    const handleTimeUpdate = () => {
      setPlaybackTime(Math.floor(audio.currentTime || 0));
    };

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
  }, [recordedAudio, recordingTime]);

  // 시간 초과 처리
  const handleTimeout = async () => {
    if (!currentQuestion || isProcessing) return;

    try {
      setIsProcessing(true);
      console.log('⏱️ 시간 초과 처리 시작:', currentQuestion.questionId);

      const response = await sendTimeout(currentQuestion.questionId);

      if (response.next && response.next.type !== 'NONE') {
        // 다음 질문으로 이동
        const nextQuestion: QuestionData = {
          questionId: response.next.nextQuestionId!,
          questionText: response.next.nextQuestionText!,
          rootId: response.next.rootId,
          rootText: response.next.rootText,
          rootIndex: response.next.rootIndex,
          type: response.next.type === 'ROOT' ? 'ROOT' : 'FOLLOW_UP',
        };

        setQuestionHistory((prev) => [...prev, nextQuestion]);
        setCurrentQuestion(nextQuestion);
        resetQuestionState();
      } else {
        // 모든 질문 종료
        setShowCompleteModal(true);
      }
    } catch (error) {
      console.error('❌ Timeout 처리 실패:', error);
      alert('시간 초과 처리 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 질문 상태 초기화
  const resetQuestionState = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setPlaybackTime(0);
    setPlaybackDuration(0);
    setRecordedAudio(null);
    setRecordedBlob(null);
    setRecordingTime(0);
    setRemainingTime(180);
    setRetryCount(1);
    isTimeoutProcessedRef.current = false;
  };

  // 다음 질문 (녹음 업로드 + Polling)
  const handleNext = async () => {
    if (!recordedBlob || !currentQuestion || isProcessing) {
      alert('답변을 녹음해주세요.');
      return;
    }

    try {
      setIsProcessing(true);
      console.log('📤 녹음 업로드 시작:', currentQuestion.questionId);

      // 녹음 업로드 + Polling으로 다음 질문 받기
      const nextQuestion = await uploadRecordingAndGetNext(
        currentQuestion.questionId,
        recordedBlob
      );

      if (nextQuestion && nextQuestion.type !== 'NONE') {
        // 다음 질문으로 이동
        const newQuestion: QuestionData = {
          questionId: nextQuestion.nextQuestionId!,
          questionText: nextQuestion.nextQuestionText!,
          rootId: nextQuestion.rootId,
          rootText: nextQuestion.rootText,
          rootIndex: nextQuestion.rootIndex,
          type: nextQuestion.type === 'ROOT' ? 'ROOT' : 'FOLLOW_UP',
        };

        setQuestionHistory((prev) => [...prev, newQuestion]);
        setCurrentQuestion(newQuestion);
        resetQuestionState();
      } else {
        // 모든 질문 종료
        setShowCompleteModal(true);
      }
    } catch (error) {
      console.error('❌ 다음 질문 처리 실패:', error);
      alert('다음 질문을 불러오는데 실패했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 질문 클릭 (이전 질문으로 이동)
  const handleQuestionClick = (index: number) => {
    if (isProcessing) return;

    // 녹음/재생 상태 정리
    stopRecording();
    resetQuestionState();

    setCurrentQuestion(questionHistory[index]);
  };

  // 최종 피드백으로 이동
  const handleFinalFeedback = () => {
    navigate('/feedback-result', {
      state: { sessionId },
    });
  };

  // 시간 포맷팅 (초 -> MM:SS)
  const formatTime = (seconds: number) => {
    const s = Math.max(0, Math.floor(seconds || 0));
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const playbackPercent =
    playbackDuration > 0
      ? Math.min(100, Math.max(0, (playbackTime / playbackDuration) * 100))
      : 0;

  const currentQuestionIndex = currentQuestion
    ? questionHistory.findIndex((q) => q.questionId === currentQuestion.questionId)
    : -1;

  if (!currentQuestion) {
    return (
      <InterviewLayout activeMenu="answer">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">질문을 불러오는 중...</p>
        </div>
      </InterviewLayout>
    );
  }

  return (
    <InterviewLayout activeMenu="answer">
      <div className="flex-1 flex flex-col px-8 pt-2 max-w-[800px]">
        {/* 상단 정보 */}
        <div className="mb-4">
          <span className="inline-block bg-gray-400 text-white px-4 py-1 rounded-full text-sm">
            {resumeKey}
          </span>
          <p className="text-gray-600 text-md mt-3">
            제한 시간 내에 면접질문에 답변해주세요.
          </p>
        </div>

        {/* 질문 탭 */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {questionHistory.map((q, index) => (
            <button
              key={q.questionId}
              onClick={() => handleQuestionClick(index)}
              disabled={isProcessing}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors flex-shrink-0 ${
                currentQuestion.questionId === q.questionId
                  ? 'bg-white border-2 border-coral-500 text-coral-500'
                  : 'bg-white border border-gray-300 text-gray-500 hover:border-gray-400'
              } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              질문{index + 1}
              {q.type === 'FOLLOW_UP' && (
                <span className="ml-1 text-xs">(꼬리)</span>
              )}
            </button>
          ))}
        </div>

        {/* 질문 카드 */}
        <div className="bg-white rounded-2xl p-8 shadow-sm mb-6 flex-1">
          <h3 className="text-xl font-semibold text-gray-700 mb-6 text-center">
            {currentQuestionIndex + 1}. ({currentQuestion.rootText})
          </h3>
          <div className="border-t border-gray-200 pt-6" />

          <p className="text-gray-700 text-center mb-8">
            {currentQuestion.questionText}
          </p>

          {/* 캐릭터 이미지 */}
          <div className="flex justify-center mb-8">
            <img
              src="src/assets/clockFrog.svg"
              alt="면접관"
              className="w-48 h-auto"
            />
          </div>

          {/* 타이머 & 녹음 컨트롤 */}
          <div className="max-w-[600px] mx-auto">
            {/* 타이머 */}
            <div className="mb-4">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-coral-500 transition-all duration-300"
                  style={{ width: `${(remainingTime / 180) * 100}%` }}
                />
              </div>
              <p className="text-center text-sm text-gray-500 mt-2">
                {remainingTime > 0
                  ? `답변 가능 시간이 ${remainingTime}초 남았습니다 ...`
                  : '시간이 종료되었습니다.'}
              </p>
            </div>

            {/* 녹음 컨트롤 */}
            {!recordedAudio ? (
              <div className="bg-gray-100 rounded-2xl p-6 mb-6">
                <div className="flex items-center justify-center gap-4">
                  {!isRecording ? (
                    <button
                      onClick={startRecording}
                      disabled={isProcessing || remainingTime === 0}
                      className={`w-16 h-16 rounded-full flex items-center justify-center shadow-md transition-colors ${
                        isProcessing || remainingTime === 0
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-coral-500 hover:bg-coral-600'
                      }`}
                    >
                      <svg
                        className="w-8 h-8 text-white"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
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
                          <svg
                            className="w-6 h-6 text-white ml-1"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        ) : (
                          <svg
                            className="w-6 h-6 text-white"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                          </svg>
                        )}
                      </button>

                      <span className="text-2xl font-bold text-coral-500">
                        {formatTime(recordingTime)}
                      </span>

                      <button
                        onClick={stopRecording}
                        className="w-12 h-12 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-md transition-colors"
                      >
                        <svg
                          className="w-6 h-6 text-white"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
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
                    disabled={isProcessing}
                    className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-colors flex-shrink-0 ${
                      isProcessing
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-coral-500 hover:bg-coral-600'
                    }`}
                  >
                    {isPlaying ? (
                      <svg
                        className="w-5 h-5 text-white"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5 text-white ml-1"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </button>

                  <div className="flex-1">
                    <div className="h-2 bg-gray-300 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-coral-500 rounded-full transition-all duration-150"
                        style={{ width: `${playbackPercent}%` }}
                      />
                    </div>
                  </div>

                  <span className="text-sm text-gray-600 font-medium flex-shrink-0">
                    {formatTime(playbackTime)} / {formatTime(playbackDuration)}
                  </span>
                </div>
                <audio
                  ref={audioRef}
                  src={recordedAudio || ''}
                  preload="metadata"
                />
              </div>
            )}

            {/* 다시 녹음하기 버튼 */}
            {recordedAudio && (
              <div className="flex justify-center mb-6">
                <button
                  onClick={handleRetry}
                  disabled={retryCount === 0 || isProcessing}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                    retryCount > 0 && !isProcessing
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
            disabled={!recordedAudio || isProcessing}
            className={`px-8 py-3 rounded-lg font-medium transition-colors ${
              recordedAudio && !isProcessing
                ? 'bg-coral-400 hover:bg-coral-500 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isProcessing ? '처리 중...' : '다음'}
          </button>
        </div>
      </div>

      {/* 완료 모달 */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-12 max-w-md w-full mx-4 text-center">
            <div className="mb-6">
              <img
                src="src/assets/orangeFrog.svg"
                alt="완료"
                className="w-24 h-auto mx-auto"
              />
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-8">
              모든 질문에 완벽히 답했어요!
            </p>
            <button
              onClick={handleFinalFeedback}
              className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-3 rounded-lg font-medium transition-colors"
            >
              최종 피드백 확인
            </button>
          </div>
        </div>
      )}

      <style>{`
        .bg-coral-50 {
          background-color: #fff5f5;
        }
        .bg-coral-400 {
          background-color: #ff9580;
        }
        .bg-coral-500 {
          background-color: #ff7f66;
        }
        .bg-coral-600 {
          background-color: #ff6b52;
        }
        .text-coral-500 {
          color: #ff7f66;
        }
        .border-coral-500 {
          border-color: #ff7f66;
        }
        .hover\\:bg-coral-500:hover {
          background-color: #ff7f66;
        }
        .hover\\:bg-coral-50:hover {
          background-color: #fff5f5;
        }
        .hover\\:bg-coral-600:hover {
          background-color: #ff6b52;
        }
      `}</style>
    </InterviewLayout>
  );
}
