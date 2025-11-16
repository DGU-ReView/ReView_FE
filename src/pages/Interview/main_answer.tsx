import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import InterviewLayout from '@/layouts/InterviewLayout';

interface IQuestion {
  id: number;
  main: string;
  sub: string;
}

export default function AnswerQuestion() {
  const navigate = useNavigate();
  const location = useLocation();
  const { fileName = '2025년_3월_자소서' } = location.state || {};

  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  // 녹음 관련 상태
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [remainingTime, setRemainingTime] = useState(180); // 3분 = 180초
  const [retryCount, setRetryCount] = useState(1);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  // 재생 관련 상태/참조 (실시간 진행 상황)
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);

  const questions: IQuestion[] = [
    { id: 1, main: '메인질문', sub: '간단히 자기소개를 해주세요.' },
    { id: 2, main: '메인질문', sub: '이 직무를 선택한 이유는 무엇인가요?' },
    { id: 3, main: '메인질문', sub: '본인의 강점은 무엇이라고 생각하나요?' },
    { id: 4, main: '메인질문', sub: '입사 후 목표는 무엇인가요?' },
  ];

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

        // 재생 상태 초기화
        setIsPlaying(false);
        setPlaybackTime(0);
        // duration은 loadedmetadata에서 확정

        // 스트림 정리
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);
      setRecordedAudio(null);

      // 녹음 타이머 초기화
      setRecordingTime(0);
      setRemainingTime(180);
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
      setRecordingTime(0);
      setRemainingTime(180);
      setRetryCount(retryCount - 1);
      startRecording();
    }
  };

  // 오디오 재생/정지 (실시간 진행 반영)
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

  // 오디오 이벤트 연결 (진행바/시간 갱신)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      const dur = isFinite(audio.duration) ? audio.duration : recordingTime || 0;
      setPlaybackDuration(Math.floor(dur));
      // 새 오디오 로드 시 진행도 초기화
      setPlaybackTime(Math.floor(audio.currentTime || 0));
    };

    const handleTimeUpdate = () => {
      setPlaybackTime(Math.floor(audio.currentTime || 0));
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      // 재생이 끝나면 진행바를 끝까지 유지했다가 0으로 초기화할지 선택 가능
      // 여기서는 끝난 뒤 0으로 초기화
      setPlaybackTime(0);
      // audio.currentTime = 0;  // 필요하면 주석 해제
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    // 이미 메타데이터가 로드된 경우 대비
    if (audio.readyState >= 1) handleLoadedMetadata();

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
    // recordedAudio가 바뀔 때마다 새로 연결
  }, [recordedAudio, recordingTime]);

  // 다음 질문
  const handleNext = () => {
    if (!recordedAudio) {
      alert('답변을 녹음해주세요.');
      return;
    }

    if (currentQuestion < 4) {
      // 재생 중이면 멈춤
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsPlaying(false);
      setPlaybackTime(0);
      setPlaybackDuration(0);

      setCurrentQuestion(currentQuestion + 1);
      // 다음 질문으로 넘어갈 때 상태 초기화
      setRecordedAudio(null);
      setRecordingTime(0);
      setRemainingTime(180);
      setRetryCount(1);
    } else {
      setShowCompleteModal(true);
    }
  };

  const handleQuestionClick = (questionNum: number) => {
    // 질문 이동 시 녹음/재생 상태 정리
    stopRecording();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setPlaybackTime(0);
    setPlaybackDuration(0);

    setRecordedAudio(null);
    setRecordingTime(0);
    setRemainingTime(180);
    setRetryCount(1);

    setCurrentQuestion(questionNum);
  };

  const handleFinalFeedback = () => {
    navigate('/feedback-result');
  };

  // 시간 포맷팅 (초 -> MM:SS)
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

        {/* 질문 탭 */}
        <div className="flex gap-2 mb-6">
          {questions.map((q) => (
            <button
              key={q.id}
              onClick={() => handleQuestionClick(q.id)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                currentQuestion === q.id
                  ? 'bg-white border-2 border-coral-500 text-coral-500'
                  : 'bg-white border border-gray-300 text-gray-500 hover:border-gray-400'
              }`}
            >
              질문{q.id}
            </button>
          ))}
        </div>

        {/* 질문 카드 */}
        <div className="bg-white rounded-2xl p-8 shadow-sm mb-6 flex-1">
          <h3 className="text-xl font-semibold text-gray-700 mb-6 text-center">
            {currentQuestion}. ({questions[currentQuestion - 1].main})
          </h3>
          <div className="border-t border-gray-200 pt-6" />

          <p className="text-gray-700 text-center mb-8">
            {currentQuestion}-1. {questions[currentQuestion - 1].sub}
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
            {!recordedAudio ? (
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
              // 재생 UI (디자인 동일, 진행바/시간만 실시간 반영)
              <div className="bg-gray-100 rounded-2xl p-6 mb-6">
                <div className="flex items-center gap-4">
                  <button
                    onClick={toggleAudioPlayback}
                    className="w-12 h-12 bg-coral-500 hover:bg-coral-600 rounded-full flex items-center justify-center shadow-md transition-colors flex-shrink-0"
                  >
                    {isPlaying ? (
                      // 일시정지 아이콘
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                      </svg>
                    ) : (
                      // 재생 아이콘
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

                  {/* 우측 시간: 현재/전체 */}
                  <span className="text-sm text-gray-600 font-medium flex-shrink-0">
                    {formatTime(playbackTime)} / {formatTime(playbackDuration)}
                  </span>
                </div>
                <audio ref={audioRef} src={recordedAudio || ''} preload="metadata" />
              </div>
            )}

            {/* 다시 녹음하기 버튼 */}
            {recordedAudio && (
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
            disabled={!recordedAudio}
            className={`px-8 py-3 rounded-lg font-medium transition-colors ${
              recordedAudio ? 'bg-coral-400 hover:bg-coral-500 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            다음
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
