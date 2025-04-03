
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
    },
  },
});

const DocumentsPage = () => {
  return (
    <Layout>
      <QueryClientProvider client={queryClient}>
        <div className="container py-6">
          <h1 className="text-2xl font-bold mb-6">Mes Documents</h1>
          <DocumentGrid />
        </div>
      </QueryClientProvider>
    </Layout>
  );
};

export default DocumentsPage;
