
import { Layout } from '@/components/Layout';
import { SkinsList } from '@/components/Skins/SkinsList';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

const SkinsPage = () => {
  return (
    <Layout>
      <div className="container max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">🎨 Mes Skins</h1>
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p>Chargement de la page de skins...</p>
          </div>
        }>
          <SkinsList />
        </Suspense>
      </div>
    </Layout>
  );
};

export default SkinsPage;
