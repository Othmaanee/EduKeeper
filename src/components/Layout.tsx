
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Home,
  FolderOpenIcon,
  Upload,
  BookText,
  Users,
  FileText,
  FileSearch,
  Pencil,
  History
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Sidebar } from './Navigation/Sidebar';
import { Header } from './Navigation/Header';
import { NavItem } from './Navigation/NavigationItem';

type LayoutProps = {
  children: React.ReactNode;
};

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('user');
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const navItems: NavItem[] = [
    { label: 'Accueil', icon: Home, path: userRole === 'enseignant' ? '/dashboard-enseignant' : '/accueil', showOrder: 1 },
    { label: 'Mes Documents', icon: FileText, path: '/documents', role: ['user', 'eleve'], showOrder: 2 },
    { label: 'Espace Enseignant', icon: Users, path: '/dashboard-enseignant', role: 'enseignant', showOrder: 2 },
    { label: 'Catégories', icon: FolderOpenIcon, path: '/categories', showOrder: 3 },
    { label: 'Résumer un Document', icon: FileSearch, path: '/summarize-document', showOrder: 4 },
    { label: 'Importer', icon: Upload, path: '/upload', showOrder: 5 },
    { label: 'Générer un cours', icon: BookText, path: '/generate', showOrder: 6 },
    { label: 'Historique', icon: History, path: '/historique', showOrder: 7 },
    { label: 'Générer des exercices', icon: Pencil, path: '/exercises', disabled: true, showOrder: 8 }
  ];

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      
      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setLoading(false);
        if (location.pathname !== '/login') {
          navigate('/login');
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      
      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setUserRole('user');
        setLoading(false);
        if (location.pathname !== '/login') {
          navigate('/login');
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);
  
  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error("Error fetching user role:", error);
        setUserRole('user');
      } else if (data) {
        setUserRole(data.role);
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch user role:", error);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoggingOut(true); 
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      toast({
        description: "Vous avez été déconnecté avec succès.",
      });
      
      navigate('/login');
      
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de se déconnecter. Veuillez réessayer.",
        variant: "destructive",
      });
      console.error("Erreur de déconnexion:", error);
    } finally {
      setLoggingOut(false);
    }
  };

  if (loading) {
    return null;
  }

  if (!user && location.pathname !== '/login') {
    navigate('/login');
    return null;
  }

  if (location.pathname === '/login') {
    return <>{children}</>;
  }

  const filteredNavItems = navItems
    .filter(item => {
      if (!item.role) return true; // If no role is specified, show for everyone
      
      if (Array.isArray(item.role)) {
        return item.role.includes(userRole);
      }
      
      return item.role === userRole;
    })
    .sort((a, b) => (a.showOrder || 99) - (b.showOrder || 99));

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navItems={filteredNavItems}
        user={user}
        onLogout={handleLogout}
        loggingOut={loggingOut}
      />
      
      <div 
        className={cn(
          "fixed inset-0 bg-black/20 z-10 md:hidden",
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setSidebarOpen(false)}
      />
      
      <main className={cn(
        "flex-1 transition-all duration-300 ease-in-out",
        sidebarOpen ? "md:ml-64" : "ml-0"
      )}>
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        
        <div className="px-4 sm:px-6 lg:px-8 py-6 pb-24">
          {children}
        </div>
      </main>
    </div>
  );
}
