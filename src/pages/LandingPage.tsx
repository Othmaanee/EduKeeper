
import React from 'react';
import { Button } from '@/components/ui/button';
import { Clock, Search, Brain, CheckCircle2, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header Navigation */}
      <header className="py-4 px-6 md:px-10 flex items-center justify-between border-b sticky top-0 z-10 bg-white">
        <div className="flex items-center gap-2">
          <img 
            src="/lovable-uploads/52a628e5-5a68-4b99-9f14-d2d9e4101c02.png" 
            alt="EduKeeper Logo" 
            className="h-8 w-8" 
          />
          <span className="font-bold text-xl">EduKeeper</span>
        </div>
        
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">
            Connexion
          </Link>
          <Button asChild className="bg-blue-500 hover:bg-blue-600">
            <Link to="/login">
              Essayer gratuitement
            </Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-6 md:px-10 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-10 md:mb-0">
            <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4">
              Révise 2x plus efficacement
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 leading-tight mb-6">
              Sans sacrifier<br />tes après-midi..
            </h1>
            
            <p className="text-lg text-gray-600 mb-8">
              Tu gagnes du temps, tu retiens mieux, tu sais où tu en es.
              Passe à la méthode intelligente.
            </p>
            
            <Button size="lg" asChild className="bg-blue-500 hover:bg-blue-600 text-base px-8 py-6 h-auto">
              <Link to="/login">
                Commencer
              </Link>
            </Button>
            
            <div className="flex items-center mt-4 text-sm text-gray-500">
              <Clock className="h-4 w-4 mr-1" />
              <span>En moins de 60 secondes</span>
            </div>
            
            <div className="flex items-center mt-2 text-sm text-gray-500">
              <CheckCircle2 className="h-4 w-4 mr-1" />
              <span>Annulable à tout moment. Sans engagement.</span>
            </div>
          </div>
          
          <div className="md:w-1/2 flex justify-center">
            <img 
              src="/lovable-uploads/52a628e5-5a68-4b99-9f14-d2d9e4101c02.png" 
              alt="EduKeeper" 
              className="w-64 h-64" 
            />
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-16 px-6 md:px-10 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Tu révises trop ou pas du tout ?
          </h2>
          
          <div className="text-center mb-10 text-gray-600">
            Coincé entre des docs partout, des notes illisibles et jamais assez de temps pour tout mémoriser ?
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600 mb-4">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">Pas assez de temps</h3>
              <p className="text-gray-600">Les heures de révision s'éternisent avec peu de résultats concrets.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 mb-4">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">Documents éparpillés</h3>
              <p className="text-gray-600">Impossible de retrouver ce qu'on cherche quand on en a besoin.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 text-purple-600 mb-4">
                <Brain className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">Mémorisation difficile</h3>
              <p className="text-gray-600">Les informations ne restent pas, malgré les efforts.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Solution Section */}
      <section className="py-16 px-6 md:px-10 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">
            La méthode intelligente en 3 étapes
          </h2>
          
          <p className="text-center text-gray-600 mb-12">
            Simple, rapide et efficace. Moins de 60 secondes pour commencer.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-blue-50 p-6 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-4">1</div>
              <h3 className="font-bold text-lg mb-3">Dépose ton cours</h3>
              <p className="text-gray-600">Importe n'importe quel document ou note de cours en quelques secondes.</p>
            </div>
            
            <div className="bg-blue-50 p-6 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-4">2</div>
              <h3 className="font-bold text-lg mb-3">Obtiens un résumé ou un QCM</h3>
              <p className="text-gray-600">Notre IA génère instantanément des supports de révision personnalisés.</p>
            </div>
            
            <div className="bg-blue-50 p-6 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 mb-4">3</div>
              <h3 className="font-bold text-lg mb-3">Sois prêt pour ton contrôle</h3>
              <p className="text-gray-600">Révise efficacement, mesure tes progrès et gagne en confiance.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-6 md:px-10 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Ces bénéfices vont transformer ta façon de réviser
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 p-2 rounded-full">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">Tous tes documents rangés et retrouvables en 1 clic</h3>
                <p className="text-gray-600">Fini les heures perdues à chercher tes notes.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 p-2 rounded-full">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">Des résumés clairs générés automatiquement</h3>
                <p className="text-gray-600">L'essentiel à retenir en quelques minutes seulement.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 p-2 rounded-full">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">Des QCM & contrôles personnalisés en 1 bouton</h3>
                <p className="text-gray-600">Teste tes connaissances instantanément, sans effort.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 p-2 rounded-full">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">Une vraie méthode pour réviser sans t'éparpiller</h3>
                <p className="text-gray-600">Structure ta préparation et gagne en efficacité.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 p-2 rounded-full">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">Tu gagnes des XP + tu débloques des skins</h3>
                <p className="text-gray-600">Reste motivé avec des récompenses pour tes efforts.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 p-2 rounded-full">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">Tu passes de "Je révise quand j'aurai le temps" à "Je maîtrise mes révisions"</h3>
                <p className="text-gray-600">Prends le contrôle de ton apprentissage.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Guarantee Section */}
      <section className="py-16 px-6 md:px-10 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-6">
            🔒 Résultat garanti
          </div>
          
          <h2 className="text-2xl md:text-3xl font-bold mb-8">
            Si tu n'as pas gagné au moins 2 heures par semaine ou amélioré ta méthode en 7 jours...
          </h2>
          
          <p className="text-gray-600 mb-10">
            Tu peux arrêter à tout moment. Sans engagement.
          </p>
          
          <Button size="lg" asChild className="bg-blue-500 hover:bg-blue-600 text-base px-8 py-6 h-auto mb-6">
            <Link to="/login">
              Commencer maintenant
            </Link>
          </Button>
          
          <div className="flex items-center justify-center text-sm text-gray-500">
            <Clock className="h-4 w-4 mr-1" />
            <span>En moins de 60 secondes. Annulable quand tu veux.</span>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-8 px-6 md:px-10 bg-gray-100 border-t">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img 
              src="/lovable-uploads/52a628e5-5a68-4b99-9f14-d2d9e4101c02.png" 
              alt="EduKeeper Logo" 
              className="h-8 w-8" 
            />
            <span className="font-bold">EduKeeper</span>
          </div>
          
          <div className="text-sm text-gray-600">
            © {new Date().getFullYear()} EduKeeper. Tous droits réservés.
          </div>
          
          <div>
            <Button asChild variant="outline" className="border-blue-500 text-blue-500 hover:bg-blue-50">
              <Link to="/login">
                S'inscrire
              </Link>
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
