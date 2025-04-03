
import { Layout } from '../components/Layout';
import { DocumentGrid } from '../components/DocumentGrid';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
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

const DocumentsPage = () => {
  return (
    <Layout>
      <QueryClientProvider client={queryClient}>
        <div className="container py-6">
          <h1 className="text-2xl font-bold mb-6">Mes Documents</h1>
          <Suspense fallback={
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          }>
            <DocumentGrid />
          </Suspense>
        </div>
      </QueryClientProvider>
    </Layout>
  );
};

export default DocumentsPage;
