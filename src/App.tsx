import { RouterProvider } from 'react-router-dom';

import RandomQuestionPopup from '@/components/RandomQuestion';

import { router } from '@/routes';

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <RandomQuestionPopup />
    </>
  );
}

export default App;
