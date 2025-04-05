
import { Layout } from '../components/Layout';
import { DocumentView } from '../components/DocumentView';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Créer un client React Query pour ce composant
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30000, // 30 secondes
    },
  },
});

const DocumentPage = () => {
  return (
    <Layout>
      <QueryClientProvider client={queryClient}>
        <DocumentView />
      </QueryClientProvider>
    </Layout>
  );
};

export default DocumentPage;
