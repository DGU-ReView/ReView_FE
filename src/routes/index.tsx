import { createBrowserRouter } from 'react-router-dom';

import Layout from '@/layouts';
import Community from '@/pages/community';
import Evaluate from '@/pages/evaluate';
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
    ],
  },
]);
