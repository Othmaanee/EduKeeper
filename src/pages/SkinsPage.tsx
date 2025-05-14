
import { Layout } from '@/components/Layout';
import { SkinsList } from '@/components/Skins/SkinsList';

const SkinsPage = () => {
  return (
    <Layout>
      <div className="container max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">🎨 Mes Skins</h1>
        <SkinsList />
      </div>
    </Layout>
  );
};

export default SkinsPage;
