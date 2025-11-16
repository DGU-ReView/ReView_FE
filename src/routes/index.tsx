import { createBrowserRouter } from 'react-router-dom';

import Layout from '@/layouts';
import Community from '@/pages/community';
import CommunityDetail from '@/pages/communityDetail';
import CommunityEdit from '@/pages/communityEdit';
import CommunityWrite from '@/pages/communityWrite';
import Evaluate from '@/pages/evaluate';
import EvaluateStart from '@/pages/evaluateStart';
import Home from '@/pages/home';
import FeedbackResult from '@/pages/Interview/feedback_result';
import MainAnswer from '@/pages/Interview/main_answer';
import QuestionDone from '@/pages/Interview/question_done';
import QuestionLoading from '@/pages/Interview/question_loading';
import MyInterview from '@/pages/Interview/upload';
import UploadCheck from '@/pages/Interview/upload_check';
import UploadDone from '@/pages/Interview/upload_done';
import MyEvaluate from '@/pages/myEvaluate';
import MyInterviews from '@/pages/myInterviews';
import MyPage from '@/pages/myPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'community', element: <Community /> },
      { path: 'myPage', element: <MyPage /> },
      { path: 'evaluate', element: <Evaluate /> },
      { path: 'evaluate/start', element: <EvaluateStart /> },
      { path: 'community/write', element: <CommunityWrite /> },
      { path: 'community/edit/:id', element: <CommunityEdit /> },
      { path: 'community/detail/:id', element: <CommunityDetail /> },
      { path: 'myInterview/:id', element: <MyInterviews /> },
      { path: 'myEvaluate/:id', element: <MyEvaluate /> },
      { path: 'myInterview', element: <MyInterview /> },
      { path: 'upload-done', element: <UploadDone /> },
      { path: 'upload-check', element: <UploadCheck /> },
      { path: 'question-loading', element: <QuestionLoading /> },
      { path: 'question-done', element: <QuestionDone /> },
      { path: 'main-answer', element: <MainAnswer /> },
      { path: 'feedback-result', element: <FeedbackResult /> },
    ],
  },
]);
