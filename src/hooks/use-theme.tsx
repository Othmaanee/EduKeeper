
import { useState, useEffect, createContext, useContext } from 'react';

type Theme = 'light' | 'dark';

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Vérifier si un thème est enregistré dans le localStorage
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem('edukeeper-theme') as Theme;
      
      // Si un thème est enregistré, l'utiliser
      if (savedTheme) {
        return savedTheme;
      }
      
      // Sinon, vérifier les préférences du système
      const userPrefersDark = window.matchMedia && 
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      return userPrefersDark ? 'dark' : 'light';
    }
    
    return 'light'; // Valeur par défaut
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    
    // Enregistrer le thème dans le localStorage
    localStorage.setItem('edukeeper-theme', theme);
  }, [theme]);

  const contextValue = {
    theme,
    setTheme: (newTheme: Theme) => {
      setTheme(newTheme);
    }
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
}
