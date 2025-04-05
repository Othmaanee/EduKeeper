
import { Layout } from '../components/Layout';
import { DocumentGrid } from '../components/DocumentGrid';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

const DocumentsPage = () => {
  return (
    <Layout>
      <div className="container py-6">
        <h1 className="text-2xl font-bold mb-2">Mes Documents</h1>
        <p className="text-muted-foreground mb-6">
          Consultez vos documents personnels et les documents partagés par vos enseignants
        </p>
        <Suspense fallback={
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }>
          <DocumentGrid />
        </Suspense>
      </div>
    </Layout>
  );
};

export default DocumentsPage;
