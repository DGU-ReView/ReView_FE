import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import RandomQuestionPopup from '@/components/RandomQuestion';

import { router } from '@/routes';

function App() {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <RandomQuestionPopup />
    </QueryClientProvider>
  );
}

export default App;
