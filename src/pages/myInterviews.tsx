import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

import useGetInterviewSummary from '@/hooks/useGetInterviewSummary';
import useGetQuestionAnswers from '@/hooks/useGetQuestionAnswers';
import useGetQuestionFeedback from '@/hooks/useGetQuestionFeedback';
import useGetRandomQuestions from '@/hooks/useGetRandomQuestions';

import ClockFrog from '@/assets/clockFrog.svg?react';

type TabType = 'answer' | 'feedback' | 'random';

export default function MyInterviews() {
  const { id } = useParams<{ id: string }>();
  const interviewId = id ? parseInt(id) : 0;

  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('answer');
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { data: summaryData, isLoading: summaryLoading } = useGetInterviewSummary(interviewId);
  const { data: answersData, isLoading: answersLoading } = useGetQuestionAnswers(activeTab === 'answer' ? selectedQuestionId : null);
  const { data: feedbackData, isLoading: feedbackLoading } = useGetQuestionFeedback(activeTab === 'feedback' ? selectedQuestionId : null);
  const { data: randomData, isLoading: randomLoading } = useGetRandomQuestions(activeTab === 'random' ? selectedQuestionId : null);

  // 첫 번째 질문 자동 선택
  useEffect(() => {
    if (summaryData?.result.questionCards && summaryData.result.questionCards.length > 0 && !selectedQuestionId) {
      setSelectedQuestionId(summaryData.result.questionCards[0].questionId);
    }
  }, [summaryData, selectedQuestionId]);

  const handleAudioPlay = (url: string) => {
    if (playingAudio === url) {
      audioRef.current?.pause();
      setPlayingAudio(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(url);
      audioRef.current.play();
      setPlayingAudio(url);

      audioRef.current.onended = () => {
        setPlayingAudio(null);
      };
    }
  };

  if (summaryLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <ClockFrog className="w-32 h-auto mx-auto animate-pulse" />
          <p className="text-gray-600 text-lg mt-4">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!summaryData?.result) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <p className="text-red-500 text-lg">면접 데이터를 찾을 수 없습니다.</p>
      </div>
    );
  }

  const { title, timedOutCount, questionCards } = summaryData.result;
  const isLoading = answersLoading || feedbackLoading || randomLoading;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">{title}</h1>
          {timedOutCount > 0 && (
            <p className="text-gray-600">
              시간 초과로 답변하지 못한 질문{' '}
              <span className="inline-block bg-[#E95F45] text-white px-3 py-1 rounded-md text-sm font-medium">{timedOutCount}개</span>
            </p>
          )}
        </div>

        {/* 질문 카드 리스트 */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">면접 질문</h2>
          <div className="grid grid-cols-4 gap-4">
            {questionCards.map((card) => (
              <button
                key={card.questionId}
                onClick={() => setSelectedQuestionId(card.questionId)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedQuestionId === card.questionId
                    ? 'border-[#E95F45] bg-[#E95F45]/10'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <p className="text-lg font-semibold text-gray-900">질문 {card.order}</p>
              </button>
            ))}
          </div>
        </div>

        {/* 탭 메뉴 */}
        <div className="bg-white rounded-t-2xl shadow-md">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('answer')}
              className={`flex-1 py-4 text-center font-medium transition-colors ${
                activeTab === 'answer' ? 'text-[#E95F45] border-b-2 border-[#E95F45]' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              답변 확인
            </button>
            <button
              onClick={() => setActiveTab('feedback')}
              className={`flex-1 py-4 text-center font-medium transition-colors ${
                activeTab === 'feedback' ? 'text-[#E95F45] border-b-2 border-[#E95F45]' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              피드백 확인
            </button>
            <button
              onClick={() => setActiveTab('random')}
              className={`flex-1 py-4 text-center font-medium transition-colors ${
                activeTab === 'random' ? 'text-[#E95F45] border-b-2 border-[#E95F45]' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              랜덤 질문
            </button>
          </div>

          {/* 탭 콘텐츠 */}
          <div className="p-6 rounded-b-2xl bg-white min-h-[400px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <ClockFrog className="w-24 h-auto animate-pulse" />
              </div>
            ) : (
              <>
                {/* 답변 확인 탭 */}
                {activeTab === 'answer' && answersData?.result && (
                  <div className="space-y-4">
                    {answersData.result.map((item) => (
                      <div key={item.questionId} className="bg-gray-50 rounded-lg p-5">
                        <div className="mb-3">
                          <span className="inline-block bg-gray-600 text-white px-3 py-1 rounded-full text-sm font-medium mr-2">
                            질문 {item.order}
                          </span>
                          <h3 className="text-lg font-semibold text-gray-900 mt-2">{item.question}</h3>
                        </div>
                        {item.answerText ? (
                          <>
                            <p className="text-gray-700 mb-3 whitespace-pre-wrap">{item.answerText}</p>
                            <button
                              onClick={() => handleAudioPlay(item.recordUrl)}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                playingAudio === item.recordUrl
                                  ? 'bg-[#E95F45] text-white hover:bg-[#E95F45]/90'
                                  : 'bg-gray-600 text-white hover:bg-gray-700'
                              }`}
                            >
                              {playingAudio === item.recordUrl ? '재생 중...' : '음성 재생'}
                            </button>
                          </>
                        ) : (
                          <p className="text-gray-500 italic">답변이 없습니다.</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* 피드백 확인 탭 */}
                {activeTab === 'feedback' && feedbackData?.result && (
                  <div className="space-y-6">
                    {/* AI 피드백 */}
                    {feedbackData.result.aiFeedback && (
                      <div className="bg-blue-50 rounded-lg p-5">
                        <h3 className="text-lg font-semibold text-blue-900 mb-3">🤖 AI 피드백</h3>
                        <p className="text-gray-700 whitespace-pre-wrap">{feedbackData.result.aiFeedback}</p>
                      </div>
                    )}

                    {/* 셀프 피드백 */}
                    {feedbackData.result.selfFeedback && (
                      <div className="bg-green-50 rounded-lg p-5">
                        <h3 className="text-lg font-semibold text-green-900 mb-3">✍️ 셀프 피드백</h3>
                        <p className="text-gray-700 whitespace-pre-wrap">{feedbackData.result.selfFeedback}</p>
                      </div>
                    )}

                    {/* 동료 피드백 */}
                    {feedbackData.result.peerItems && feedbackData.result.peerItems.length > 0 && (
                      <div className="bg-purple-50 rounded-lg p-5">
                        <h3 className="text-lg font-semibold text-purple-900 mb-3">👥 동료 피드백</h3>
                        <ul className="space-y-2">
                          {feedbackData.result.peerItems.map((item, index) => (
                            <li key={index} className="text-gray-700 flex items-start">
                              <span className="text-purple-500 mr-2">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {!feedbackData.result.aiFeedback && !feedbackData.result.selfFeedback && feedbackData.result.peerItems.length === 0 && (
                      <p className="text-gray-500 italic text-center py-8">피드백이 없습니다.</p>
                    )}
                  </div>
                )}

                {/* 랜덤 질문 탭 */}
                {activeTab === 'random' && randomData?.result && (
                  <div className="space-y-4">
                    {randomData.result.length > 0 ? (
                      randomData.result.map((item, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-5">
                          <div className="mb-3">
                            <span className="inline-block bg-[#E95F45] text-white px-3 py-1 rounded-full text-sm font-medium mb-2">
                              랜덤 질문 {index + 1}
                            </span>
                            <h3 className="text-lg font-semibold text-gray-900">{item.question}</h3>
                          </div>

                          <div className="mb-3">
                            <p className="text-sm font-semibold text-gray-600 mb-1">답변:</p>
                            <p className="text-gray-700 whitespace-pre-wrap">{item.answerText}</p>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-3">
                            {item.aiFeedback && (
                              <div className="bg-blue-100 rounded p-3">
                                <p className="text-sm font-semibold text-blue-900 mb-1">AI 피드백</p>
                                <p className="text-sm text-gray-700">{item.aiFeedback}</p>
                              </div>
                            )}
                            {item.selfFeedback && (
                              <div className="bg-green-100 rounded p-3">
                                <p className="text-sm font-semibold text-green-900 mb-1">셀프 피드백</p>
                                <p className="text-sm text-gray-700">{item.selfFeedback}</p>
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => handleAudioPlay(item.recordingUrl)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              playingAudio === item.recordingUrl
                                ? 'bg-[#E95F45] text-white hover:bg-[#E95F45]/90'
                                : 'bg-gray-600 text-white hover:bg-gray-700'
                            }`}
                          >
                            {playingAudio === item.recordingUrl ? '재생 중...' : '음성 재생'}
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 italic text-center py-8">랜덤 질문이 없습니다.</p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
