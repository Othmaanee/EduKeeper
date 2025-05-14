
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DemoRequestDialog } from '@/components/DemoRequestDialog';
import { Link, useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const [isDemoDialogOpen, setIsDemoDialogOpen] = useState(false);
  const navigate = useNavigate();

  const openDemoDialog = () => {
    setIsDemoDialogOpen(true);
  };

  // Fonction pour rediriger vers la page de login
  const redirectToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header Navigation */}
      <header className="py-4 px-6 md:px-10 flex items-center justify-between border-b bg-white/90 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <img 
            src="/lovable-uploads/52a628e5-5a68-4b99-9f14-d2d9e4101c02.png" 
            alt="EduKeeper Logo" 
            className="h-8 w-8 text-primary" 
          />
          <span className="font-bold text-xl text-slate-800">EduKeeper</span>
        </div>
        
        <div className="hidden md:flex items-center gap-4">
          <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">
            Connexion
          </Link>
          <Button onClick={redirectToLogin} className="bg-blue-600 hover:bg-blue-700">
            Essayer gratuitement
          </Button>
        </div>
        
        <Button className="md:hidden" asChild>
          <Link to="/login">
            Connexion
          </Link>
        </Button>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6 md:px-10 lg:px-20 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8 items-center">
          <div className="flex-1 space-y-6">
            <div className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-medium mb-2">
              Révise 2x plus efficacement
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-800 leading-tight">
              Sans sacrifier tes après-midi..
            </h1>
            <p className="text-lg md:text-xl text-slate-600 max-w-lg">
              Tu gagnes du temps, tu retiens mieux, tu sais où tu en es.
              Passe à la méthode intelligente.
            </p>
            <div className="flex gap-4 items-center pt-2">
              <Button onClick={redirectToLogin} size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-6 h-auto text-base">
                Commencer
              </Button>
              <span className="text-slate-500">🎯 En moins de 60 secondes</span>
            </div>
            <p className="text-slate-500 text-sm">
              🔓 Annulable à tout moment. Sans engagement.
            </p>
          </div>
          <div className="flex-1 hidden md:block">
            <img 
              src="/lovable-uploads/52a628e5-5a68-4b99-9f14-d2d9e4101c02.png" 
              alt="EduKeeper interface" 
              className="max-w-md mx-auto drop-shadow-lg"
            />
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-16 px-6 md:px-10 lg:px-20 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4">
              Tu révises trop ou pas du tout ?
            </h2>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto">
              Coincé entre des docs partout, des notes illisibles et jamais assez de temps pour tout mémoriser ?
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
              <div className="text-red-500 text-xl font-bold mb-3">⏰</div>
              <h3 className="font-semibold text-lg mb-2">Pas assez de temps</h3>
              <p className="text-slate-600">Les heures de révision s'éternisent avec peu de résultats concrets.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
              <div className="text-red-500 text-xl font-bold mb-3">🔍</div>
              <h3 className="font-semibold text-lg mb-2">Documents éparpillés</h3>
              <p className="text-slate-600">Impossible de retrouver ce qu'on cherche quand on en a besoin.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
              <div className="text-red-500 text-xl font-bold mb-3">🧠</div>
              <h3 className="font-semibold text-lg mb-2">Mémorisation difficile</h3>
              <p className="text-slate-600">Les informations ne restent pas, malgré les efforts.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-16 px-6 md:px-10 lg:px-20 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4">
              La méthode intelligente en 3 étapes
            </h2>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto">
              Simple, rapide et efficace. Moins de 60 secondes pour commencer.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
              <div className="text-blue-600 text-xl font-bold mb-3">1</div>
              <h3 className="font-semibold text-lg mb-2">Dépose ton cours</h3>
              <p className="text-slate-600">Importe n'importe quel document ou note de cours en quelques secondes.</p>
            </div>
            
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
              <div className="text-blue-600 text-xl font-bold mb-3">2</div>
              <h3 className="font-semibold text-lg mb-2">Obtiens un résumé ou un QCM</h3>
              <p className="text-slate-600">Notre IA génère instantanément des supports de révision personnalisés.</p>
            </div>
            
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
              <div className="text-blue-600 text-xl font-bold mb-3">3</div>
              <h3 className="font-semibold text-lg mb-2">Sois prêt pour ton contrôle</h3>
              <p className="text-slate-600">Révise efficacement, mesure tes progrès et gagne en confiance.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-6 md:px-10 lg:px-20 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block px-4 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-medium mb-3">
              💎 Bénéfices visibles
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4">
              Ces bénéfices vont transformer ta façon de réviser
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="flex gap-4 items-start">
              <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                🗂️
              </div>
              <div>
                <h3 className="font-semibold text-lg">Tous tes documents rangés et retrouvables en 1 clic</h3>
                <p className="text-slate-600 mt-1">Fini les heures perdues à chercher tes notes.</p>
              </div>
            </div>
            
            <div className="flex gap-4 items-start">
              <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                🧠
              </div>
              <div>
                <h3 className="font-semibold text-lg">Des résumés clairs générés automatiquement</h3>
                <p className="text-slate-600 mt-1">L'essentiel à retenir en quelques minutes seulement.</p>
              </div>
            </div>
            
            <div className="flex gap-4 items-start">
              <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                📊
              </div>
              <div>
                <h3 className="font-semibold text-lg">Des QCM & contrôles personnalisés en 1 bouton</h3>
                <p className="text-slate-600 mt-1">Teste tes connaissances instantanément, sans effort.</p>
              </div>
            </div>
            
            <div className="flex gap-4 items-start">
              <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                🎯
              </div>
              <div>
                <h3 className="font-semibold text-lg">Une vraie méthode pour réviser sans t'éparpiller</h3>
                <p className="text-slate-600 mt-1">Structure ta préparation et gagne en efficacité.</p>
              </div>
            </div>
            
            <div className="flex gap-4 items-start">
              <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                🎮
              </div>
              <div>
                <h3 className="font-semibold text-lg">Tu gagnes des XP + tu débloques des skins</h3>
                <p className="text-slate-600 mt-1">Reste motivé avec des récompenses pour tes efforts.</p>
              </div>
            </div>
            
            <div className="flex gap-4 items-start">
              <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                🕹️
              </div>
              <div>
                <h3 className="font-semibold text-lg">Tu passes de "Je révise quand j'aurai le temps" à "Je maîtrise mes révisions"</h3>
                <p className="text-slate-600 mt-1">Prends le contrôle de ton apprentissage.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Proof / Guarantee Section */}
      <section className="py-16 px-6 md:px-10 lg:px-20 bg-white border-y border-slate-100">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block mb-6">
            <div className="bg-green-50 text-green-600 px-4 py-2 rounded-full text-sm font-medium">
              🔒 Résultat garanti
            </div>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4">
            Si tu n'as pas gagné au moins 2 heures par semaine ou amélioré ta méthode en 7 jours...
          </h2>
          <p className="text-slate-600 text-lg mb-8">
            Tu peux arrêter à tout moment. Sans engagement.
          </p>
          <Button 
            onClick={redirectToLogin} 
            size="lg" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 h-auto text-lg"
          >
            Commencer maintenant
          </Button>
          <p className="text-slate-500 text-sm mt-4">
            🎯 En moins de 60 secondes. Annulable quand tu veux.
          </p>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="py-8 px-6 md:px-10 lg:px-20 bg-slate-50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <img 
              src="/lovable-uploads/52a628e5-5a68-4b99-9f14-d2d9e4101c02.png" 
              alt="EduKeeper Logo" 
              className="h-8 w-8" 
            />
            <span className="font-bold text-slate-800">EduKeeper</span>
          </div>
          <div className="text-slate-500 text-sm">
            © 2024 EduKeeper. Tous droits réservés.
          </div>
        </div>
      </footer>

      {/* Demo request dialog */}
      <DemoRequestDialog open={isDemoDialogOpen} onOpenChange={setIsDemoDialogOpen} />
    </div>
  );
};

export default LandingPage;
