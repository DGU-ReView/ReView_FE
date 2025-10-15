import { createBrowserRouter } from 'react-router-dom';

import Layout from '@/layouts';
import Community from '@/pages/community';
import CommunityDetail from '@/pages/communityDetail';
import CommunityEdit from '@/pages/communityEdit';
import CommunityWrite from '@/pages/communityWrite';
import Evaluate from '@/pages/evaluate';
import EvaluateStart from '@/pages/evaluateStart';
import Home from '@/pages/home';
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
      { path: 'community/edit', element: <CommunityEdit /> },
      { path: 'community/detail/:id', element: <CommunityDetail /> },
    ],
  },
]);
