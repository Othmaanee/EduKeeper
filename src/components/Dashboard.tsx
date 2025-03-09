
import { Upload, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Link } from 'react-router-dom';
import { CategoryCard } from './CategoryCard';
import { RecentDocuments } from './RecentDocuments';
import { cn } from '@/lib/utils';

export function Dashboard() {
  const categories = [
    { id: 'math', name: 'Mathématiques', count: 24, color: 'blue' },
    { id: 'french', name: 'Français', count: 18, color: 'green' },
    { id: 'history', name: 'Histoire', count: 12, color: 'amber' },
    { id: 'science', name: 'Sciences', count: 30, color: 'purple' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/80 to-primary p-6 md:p-8 text-white">
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Bonjour, John Doe
          </h1>
          <p className="mt-2 text-white/90 max-w-xl">
            Bienvenue dans votre espace de ressources éducatives. Vous pouvez organiser, consulter et partager tous vos documents pédagogiques.
          </p>
          
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild className="bg-white text-primary hover:bg-white/90">
              <Link to="/upload">
                <Upload className="h-4 w-4 mr-2" />
                Importer des documents
              </Link>
            </Button>
            <Button variant="ghost" className="bg-white/20 hover:bg-white/30 text-white">
              Explorer mes ressources
            </Button>
          </div>
          
          <div className="mt-6 flex items-center text-sm text-white/90">
            <CheckCircle className="h-4 w-4 mr-2" />
            <span>Dernière mise à jour: 15 octobre 2023</span>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-primary/20 to-transparent" />
        <div className="absolute -bottom-4 -right-4 h-32 w-32 rounded-full bg-white/10" />
        <div className="absolute -top-6 right-12 h-20 w-20 rounded-full bg-white/10" />
      </section>
      
      {/* Categories Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Catégories</h2>
          <Link 
            to="/categories"
            className="text-sm font-medium text-primary hover:underline"
          >
            Voir toutes
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((category) => (
            <CategoryCard 
              key={category.id}
              id={category.id}
              name={category.name}
              count={category.count}
              color={category.color}
              className="animate-scale-in"
            />
          ))}
        </div>
      </section>
      
      {/* Recent Documents Section */}
      <RecentDocuments />
    </div>
  );
}
