
import { Layout } from '@/components/Layout';
import { HistoryList } from '@/components/HistoryList';
import { History } from 'lucide-react';

const HistoryPage = () => {
  return (
    <Layout>
      <div className="container py-6">
        <div className="flex items-center gap-2 mb-6">
          <History className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Mon Historique</h1>
        </div>
        <p className="text-muted-foreground mb-8">
          Consultez l'historique de vos actions récentes
        </p>
        
        <HistoryList />
      </div>
    </Layout>
  );
};

export default HistoryPage;
