
import { Layout } from '@/components/Layout';
import { ProfileForm } from '@/components/Profile/ProfileForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export function ProfilePage() {
  return (
    <Layout>
      <div className="container max-w-4xl py-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link to="/accueil" className="flex items-center text-muted-foreground">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour à l'accueil
          </Link>
        </Button>
        
        <h1 className="text-2xl font-bold mb-6">Mon profil</h1>
        
        <ProfileForm />
      </div>
    </Layout>
  );
}

export default ProfilePage;
