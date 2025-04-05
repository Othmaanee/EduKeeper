
import { FolderOpenIcon, FileText } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

type CategoryCardProps = {
  id: string;
  name: string;
  count: number;
  color?: string;
  className?: string;
};

export function CategoryCard({ id, name, count, color = "blue", className }: CategoryCardProps) {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string | null>(null);
  
  useEffect(() => {
    // Determine user role for proper navigation
    const getUserRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;
      
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();
        
      if (!error && data) {
        setUserRole(data.role);
      }
    };
    
    getUserRole();
  }, []);
  
  const handleCategoryClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // Navigate to the appropriate route based on user role
    navigate(`/documents?category_id=${id}`);
  };

  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    green: "bg-green-50 text-green-600 border-green-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
    amber: "bg-amber-50 text-amber-600 border-amber-200",
    rose: "bg-rose-50 text-rose-600 border-rose-200",
  };

  return (
    <Link 
      to={`/documents?category_id=${id}`}
      onClick={handleCategoryClick}
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-all duration-300",
        "hover:shadow-elevation hover:-translate-y-1",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className={cn(
          "inline-flex items-center justify-center rounded-lg p-2.5",
          colorMap[color]
        )}>
          <FolderOpenIcon className="h-5 w-5" />
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          {count} document{count !== 1 ? 's' : ''}
        </span>
      </div>
      
      <div className="mt-5">
        <h3 className="font-medium text-lg tracking-tight">{name}</h3>
        <div className="mt-1 text-muted-foreground text-sm line-clamp-2">
          {count > 0 ? (
            <>
              <FileText className="inline-block h-3.5 w-3.5 mr-1.5 align-text-bottom" />
              Explorez tous les documents
            </>
          ) : (
            "Aucun document disponible dans cette catégorie."
          )}
        </div>
      </div>

      <div className="h-2 absolute bottom-0 left-0 right-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent group-hover:opacity-100 opacity-0 transition-opacity" />
    </Link>
  );
}
