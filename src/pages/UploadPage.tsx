
import { Layout } from '../components/Layout';
import { UploadComponent } from '../components/UploadModal';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30000, // 30 seconds
    },
  },
});

const UploadPage = () => {
  return (
    <Layout>
      <QueryClientProvider client={queryClient}>
        <UploadComponent />
        <Toaster />
      </QueryClientProvider>
    </Layout>
  );
};

export default UploadPage;
