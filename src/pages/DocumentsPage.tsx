
import { Layout } from '../components/Layout';
import { DocumentGrid } from '../components/DocumentGrid';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

const DocumentsPage = () => {
  return (
    <Layout>
      <div className="container py-6">
        <h1 className="text-2xl font-bold mb-6">Mes Documents</h1>
        <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
          <DocumentGrid />
        </Suspense>
      </div>
    </Layout>
  );
};

export default DocumentsPage;
