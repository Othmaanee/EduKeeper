
import { useSearchParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { UploadComponent } from '../components/UploadModal';

const UploadPage = () => {
  const [searchParams] = useSearchParams();
  const categoryId = searchParams.get('category_id');

  return (
    <Layout>
      <UploadComponent initialCategoryId={categoryId} />
    </Layout>
  );
};

export default UploadPage;
