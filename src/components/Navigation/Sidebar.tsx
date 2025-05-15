
import React, { useEffect, useState } from "react";
import { Link, useMatch } from "react-router-dom";
import {
  Book,
  FileText,
  Layout as LayoutIcon,
  BookOpen,
  FilePlus,
  Dumbbell,
  History,
  Palette,
  LogOut,
  User,
  FileCheck,
  Users,
  ChevronDown,
  LogIn
} from "lucide-react";
import { NavigationItem } from "./NavigationItem";
import { UserProfile } from "./UserProfile";
import { cn } from '@/lib/utils';
import { useMobileSupport } from '@/hooks/use-mobile';
import { UserLevel } from '@/components/UserLevel';
import { supabase } from '@/integrations/supabase/client';

export function Sidebar() {
  const { isMobile } = useMobileSupport();
  const [isExpanded, setIsExpanded] = useState(!isMobile);
  const [isTeacher, setIsTeacher] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  
  useEffect(() => {
    setIsExpanded(!isMobile);
  }, [isMobile]);
  
  // Vérifier si l'utilisateur est un enseignant et est authentifié
  useEffect(() => {
    const checkUserStatus = async () => {
      const { data: session } = await supabase.auth.getSession();
      
      if (session?.session) {
        setIsAuthenticated(true);
        
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.session.user.id)
          .single();
          
        if (userData && userData.role === 'enseignant') {
          setIsTeacher(true);
        } else {
          setIsTeacher(false);
        }
      } else {
        setIsAuthenticated(false);
        setIsTeacher(false);
      }
    };
    
    checkUserStatus();
    
    // Abonnement aux changements d'authentification
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        checkUserStatus();
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setIsTeacher(false);
      }
    });
    
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);
  
  // Toggle section expansion
  const toggleSection = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };
  
  // Check if route is active
  const isActive = (path: string) => {
    return !!useMatch(path);
  };
  
  return (
    <div 
      className={cn(
        "min-h-screen h-full flex flex-col border-r bg-sidebar transition-all duration-300 z-10",
        isExpanded ? "w-[280px]" : "w-[64px]"
      )}
    >
      <div className="flex flex-col flex-grow overflow-y-auto scrollbar-hide">
        <div className="px-3 py-3">
          <UserProfile isExpanded={isExpanded} />
        </div>
        
        <div className="mt-2 px-3 flex-1">
          {/* Accueil */}
          <NavigationItem
            to="/accueil"
            icon={<LayoutIcon className="h-5 w-5" />}
            label="Accueil"
            isExpanded={isExpanded}
            isActive={isActive("/accueil")}
          />
          
          {/* Documents Section */}
          <div className="mt-6">
            <div
              className={cn(
                "flex items-center rounded-lg px-2 py-1.5 text-sm font-medium cursor-pointer",
                isExpanded ? "justify-between" : "justify-center",
                expandedSection === "documents" ? "bg-muted" : "hover:bg-muted/50"
              )}
              onClick={() => isExpanded && toggleSection("documents")}
            >
              {isExpanded ? (
                <>
                  <span className="text-foreground/70">Documents</span>
                  <ChevronDown 
                    className={cn(
                      "h-4 w-4 text-foreground/50 transition-transform",
                      expandedSection === "documents" && "transform rotate-180"
                    )} 
                  />
                </>
              ) : (
                <FileText className="h-5 w-5 text-foreground/70" />
              )}
            </div>
            
            {(isExpanded && expandedSection === "documents") && (
              <div className="ml-3 mt-1 space-y-1">
                <NavigationItem
                  to="/documents"
                  icon={<FileText className="h-5 w-5" />}
                  label="Mes documents"
                  isExpanded={true}
                  isActive={isActive("/documents")}
                  isNested={true}
                />
                <NavigationItem
                  to="/upload"
                  icon={<FilePlus className="h-5 w-5" />}
                  label="Importer un document"
                  isExpanded={true}
                  isActive={isActive("/upload")}
                  isNested={true}
                />
                <NavigationItem
                  to="/categories"
                  icon={<Book className="h-5 w-5" />}
                  label="Catégories"
                  isExpanded={true}
                  isActive={isActive("/categories")}
                  isNested={true}
                />
              </div>
            )}
          </div>
          
          {/* AI Section */}
          <div className="mt-4">
            <div
              className={cn(
                "flex items-center rounded-lg px-2 py-1.5 text-sm font-medium cursor-pointer",
                isExpanded ? "justify-between" : "justify-center",
                expandedSection === "ai" ? "bg-muted" : "hover:bg-muted/50"
              )}
              onClick={() => isExpanded && toggleSection("ai")}
            >
              {isExpanded ? (
                <>
                  <span className="text-foreground/70">Génération IA</span>
                  <ChevronDown 
                    className={cn(
                      "h-4 w-4 text-foreground/50 transition-transform",
                      expandedSection === "ai" && "transform rotate-180"
                    )} 
                  />
                </>
              ) : (
                <BookOpen className="h-5 w-5 text-foreground/70" />
              )}
            </div>
            
            {(isExpanded && expandedSection === "ai") && (
              <div className="ml-3 mt-1 space-y-1">
                <NavigationItem
                  to="/summarize-document"
                  icon={<BookOpen className="h-5 w-5" />}
                  label="Résumé de document"
                  isExpanded={true}
                  isActive={isActive("/summarize-document")}
                  isNested={true}
                />
                <NavigationItem
                  to="/generate"
                  icon={<FileCheck className="h-5 w-5" />}
                  label="Contrôle"
                  isExpanded={true}
                  isActive={isActive("/generate")}
                  isNested={true}
                />
                <NavigationItem
                  to="/exercises"
                  icon={<Dumbbell className="h-5 w-5" />}
                  label="Exercices"
                  isExpanded={true}
                  isActive={isActive("/exercises")}
                  isNested={true}
                />
              </div>
            )}
          </div>
          
          {/* Teacher Section */}
          {isTeacher && (
            <div className="mt-6">
              <NavigationItem
                to="/teacher-dashboard"
                icon={<Users className="h-5 w-5" />}
                label="Tableau de bord"
                isExpanded={isExpanded}
                isActive={isActive("/teacher-dashboard")}
              />
            </div>
          )}
          
          {/* History */}
          <NavigationItem
            to="/history"
            icon={<History className="h-5 w-5" />}
            label="Historique"
            isExpanded={isExpanded}
            isActive={isActive("/history")}
            className="mt-6"
          />
          
          {/* Skins */}
          <NavigationItem
            to="/skins"
            icon={<Palette className="h-5 w-5" />}
            label="Mes Skins"
            isExpanded={isExpanded}
            isActive={isActive("/skins")}
          />
          
          {/* Profile */}
          <NavigationItem
            to="/profile"
            icon={<User className="h-5 w-5" />}
            label="Profil"
            isExpanded={isExpanded}
            isActive={isActive("/profile")}
          />
        </div>
      </div>
      
      {/* XP Bar at bottom */}
      {isAuthenticated && isExpanded && (
        <div className="border-t p-3">
          <UserLevel />
        </div>
      )}
      
      {/* Login/Logout */}
      <div className="border-t p-3">
        {isAuthenticated ? (
          <Link
            to="/login?logout=true"
            className={cn(
              "flex items-center rounded-lg px-2 py-1.5 text-sm font-medium",
              isExpanded ? "" : "justify-center",
              "hover:bg-muted/80 transition-colors text-destructive/70 hover:text-destructive"
            )}
          >
            <LogOut className="h-5 w-5" />
            {isExpanded && <span className="ml-2">Déconnexion</span>}
          </Link>
        ) : (
          <Link
            to="/login"
            className={cn(
              "flex items-center rounded-lg px-2 py-1.5 text-sm font-medium",
              isExpanded ? "" : "justify-center",
              "hover:bg-muted/80 transition-colors text-primary/70 hover:text-primary"
            )}
          >
            <LogIn className="h-5 w-5" />
            {isExpanded && <span className="ml-2">Connexion</span>}
          </Link>
        )}
      </div>
    </div>
  );
}
