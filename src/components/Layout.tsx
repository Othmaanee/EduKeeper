
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Home,
  FolderOpenIcon,
  Upload,
  LogOut,
  Menu,
  X,
  ChevronRight,
  BookText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SearchBar } from './SearchBar';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';

type LayoutProps = {
  children: React.ReactNode;
};

const navItems = [
  { label: 'Accueil', icon: Home, path: '/' },
  { label: 'Documents', icon: BookOpen, path: '/documents' },
  { label: 'Catégories', icon: FolderOpenIcon, path: '/categories' },
  { label: 'Importer', icon: Upload, path: '/upload' },
  { label: 'Générer un cours', icon: BookText, path: '/generate' }
];

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (!session && location.pathname !== '/login') {
        navigate('/login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  const handleLogout = async () => {
    try {
      setLoggingOut(true); 
      
      // Effectuer la déconnexion
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      // Notification de déconnexion réussie
      toast({
        description: "Vous avez été déconnecté avec succès.",
      });
      
      // Redirection vers la page de connexion
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

  // Show nothing while checking authentication
  if (loading) {
    return null;
  }

  // Redirect to login if no user and not already on login page
  if (!user && location.pathname !== '/login') {
    navigate('/login');
    return null;
  }

  // Don't render layout for login page
  if (location.pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-20 w-64 bg-white shadow-subtle border-r border-border transition-all duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="px-6 py-8 flex items-center">
            <BookOpen className="h-8 w-8 text-primary mr-2" />
            <h1 className="text-xl font-semibold tracking-tight">EduKeeper</h1>
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto md:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <Separator />
          
          {/* Nav Links */}
          <nav className="flex-1 px-3 py-6 space-y-1">
            {navItems.map((item) => (
              <Link 
                key={item.path} 
                to={item.path}
                className={cn(
                  "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  location.pathname === item.path 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5 mr-3" />
                <span>{item.label}</span>
                {location.pathname === item.path && (
                  <ChevronRight className="h-4 w-4 ml-auto" />
                )}
              </Link>
            ))}
          </nav>
          
          {/* User Section */}
          <div className="p-4 mt-auto">
            <Separator className="mb-4" />
            <div className="flex items-center">
              <Avatar className="h-9 w-9">
                <AvatarImage src="" />
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="ml-3">
                <p className="text-sm font-medium">
                  {user?.email ? user.email.split('@')[0] : 'Utilisateur'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user?.email || 'utilisateur@exemple.com'}
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="ml-auto text-muted-foreground hover:text-destructive"
                onClick={handleLogout}
                disabled={loggingOut}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>
      
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-10 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Main Content */}
      <main className={cn(
        "flex-1 transition-all duration-300 ease-in-out",
        sidebarOpen ? "md:ml-64" : "ml-0"
      )}>
        {/* Top Bar */}
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-border">
          <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="mr-2"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <SearchBar />
            </div>
            
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" className="hidden sm:flex" asChild>
                <Link to="/upload">
                  <Upload className="h-4 w-4 mr-2" />
                  Importer
                </Link>
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden bg-primary/10 text-primary"
                asChild
              >
                <Link to="/upload">
                  <Upload className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        <div className="px-4 sm:px-6 lg:px-8 py-6 pb-24">
          {children}
        </div>
      </main>
    </div>
  );
}
