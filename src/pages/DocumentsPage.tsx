
import { Layout } from '../components/Layout';
import { DocumentGrid } from '../components/DocumentGrid';

const DocumentsPage = () => {
  return (
    <Layout>
      <div className="container py-6">
        <h1 className="text-2xl font-bold mb-6">Mes Documents</h1>
        <DocumentGrid />
      </div>
    </Layout>
  );
};

export default DocumentsPage;
