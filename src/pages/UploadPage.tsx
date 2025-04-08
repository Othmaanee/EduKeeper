
import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { UploadComponent } from '../components/UploadModal';
import { useSearchParams } from 'react-router-dom';

const UploadPage = () => {
  const [searchParams] = useSearchParams();
  const [initialCategoryId, setInitialCategoryId] = useState<string | null>(null);
  
  useEffect(() => {
    // Get the category_id from URL parameters, if it exists
    const categoryId = searchParams.get('category_id');
    if (categoryId) {
      setInitialCategoryId(categoryId);
    }
  }, [searchParams]);
  
  return (
    <Layout>
      <UploadComponent initialCategoryId={initialCategoryId} />
    </Layout>
  );
};

export default UploadPage;
