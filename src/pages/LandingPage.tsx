
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Clock, 
  Search, 
  Users, 
  Upload, 
  Shield, 
  FileText, 
  PencilRuler, 
  Brain, 
  CheckCircle2, 
  School,
  Building2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { DemoRequestDialog } from '@/components/DemoRequestDialog';

const LandingPage = () => {
  const [isDemoDialogOpen, setIsDemoDialogOpen] = useState(false);

  const openDemoDialog = () => {
    setIsDemoDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
      {/* Header Navigation */}
      <header className="py-4 px-6 md:px-10 flex items-center justify-between border-b bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <img 
            src="/lovable-uploads/52a628e5-5a68-4b99-9f14-d2d9e4101c02.png" 
            alt="EduKeeper Logo" 
            className="h-8 w-8 text-primary" 
          />
          <span className="font-bold text-xl">EduKeeper</span>
        </div>
        
        <div className="hidden md:flex items-center gap-4">
          <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">
            Connexion
          </Link>
          <Button onClick={openDemoDialog}>
            Démo gratuite
          </Button>
        </div>
        
        <Button className="md:hidden" asChild>
          <Link to="/login">
            Connexion
          </Link>
        </Button>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6 md:px-10 lg:px-20 flex flex-col items-center text-center max-w-6xl mx-auto">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 leading-tight mb-6">
          Simplifiez la Gestion et la Transmission des Documents. Dès Aujourd'hui.
        </h1>
        <p className="text-lg md:text-xl text-gray-600 max-w-3xl mb-10">
          Trouvez, envoyez et sécurisez vos ressources pédagogiques en un éclair. 
          EduKeeper rend votre organisation fluide, puissante et intelligente.
        </p>
        <Button size="lg" onClick={openDemoDialog} className="text-base px-8 py-6 h-auto gap-3">
          Voyez comment avec une démo gratuite
          <span className="inline-block">👉</span>
        </Button>
      </section>

      {/* Pain Points Section */}
      <section className="py-14 px-6 md:px-10 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            Ras-le-bol du chaos documentaire ?
          </h2>
          
          <div className="text-center mb-12 text-lg text-gray-600">
            <p className="mb-4">Documents éparpillés. Exercices introuvables. Cours égarés.</p>
            <p>Partager devient lent et pénible.</p>
          </div>
          
          <div className="text-center mb-8 font-medium text-xl text-gray-800">
            Avec EduKeeper, tout change :
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 md:gap-10">
            <Card className="bg-white shadow-subtle border-primary/10 hover:shadow-elevation transition-shadow">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <Clock className="h-10 w-10 text-primary mb-4" />
                <h3 className="font-bold text-lg mb-2">Gagnez du temps.</h3>
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow-subtle border-primary/10 hover:shadow-elevation transition-shadow">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <Search className="h-10 w-10 text-primary mb-4" />
                <h3 className="font-bold text-lg mb-2">Retrouvez tout en un clin d'œil.</h3>
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow-subtle border-primary/10 hover:shadow-elevation transition-shadow">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <Users className="h-10 w-10 text-primary mb-4" />
                <h3 className="font-bold text-lg mb-2">Offrez une expérience simple et moderne à vos équipes et vos élèves.</h3>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-6 md:px-10">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            EduKeeper, bien plus qu'un espace de stockage
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 mb-16">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">Upload instantané</h3>
                <p className="text-gray-600">Classez vos documents en quelques clics.</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">Espaces personnels</h3>
                <p className="text-gray-600">Chaque enseignant et chaque élève a son propre espace sécurisé.</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="p-3 bg-primary/10 rounded-full">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">Envoi direct</h3>
                <p className="text-gray-600">Les professeurs transmettent cours et exercices à leurs élèves en quelques secondes.</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">IA embarquée</h3>
                <p className="text-gray-600">
                  Résumez vos documents sans effort.<br />
                  Générez des cours clairs en quelques instants.<br />
                  Créez des exercices adaptés en un clic.
                </p>
              </div>
            </div>
          </div>
          
          <div className="text-center text-lg text-gray-700 italic bg-primary/5 p-6 rounded-lg">
            Imaginez : un bureau numérique propre, intuitif, boosté par l'intelligence artificielle.
          </div>
        </div>
      </section>
      
      {/* Target Audience */}
      <section className="py-16 px-6 md:px-10 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            Pour qui ?
          </h2>
          
          <p className="text-center mb-10 text-lg">EduKeeper est conçu pour :</p>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-white shadow-subtle border-primary/10">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <School className="h-10 w-10 text-primary mb-4" />
                <h3 className="font-bold text-lg mb-2">CFA</h3>
                <p className="text-gray-600">Qui veulent moderniser leur pédagogie.</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow-subtle border-primary/10">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <Building2 className="h-10 w-10 text-primary mb-4" />
                <h3 className="font-bold text-lg mb-2">Écoles et Universités</h3>
                <p className="text-gray-600">Collèges, lycées et universités voulant fluidifier leur organisation.</p>
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow-subtle border-primary/10">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <img 
                  src="/lovable-uploads/52a628e5-5a68-4b99-9f14-d2d9e4101c02.png"
                  alt="EduKeeper Logo"
                  className="h-10 w-10 text-primary mb-4" 
                />
                <h3 className="font-bold text-lg mb-2">Enseignants et élèves</h3>
                <p className="text-gray-600">En quête de simplicité et de performance.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      {/* Offer Section */}
      <section className="py-16 px-6 md:px-10 bg-primary/10">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-6">
            🌟 Testez EduKeeper gratuitement et sans engagement
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            <div className="bg-white p-6 rounded-lg shadow-subtle flex flex-col items-center text-center">
              <CheckCircle2 className="h-8 w-8 text-primary mb-3" />
              <p>Démo personnalisée offerte.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-subtle flex flex-col items-center text-center">
              <CheckCircle2 className="h-8 w-8 text-primary mb-3" />
              <p>Mise en place en moins d'une journée.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-subtle flex flex-col items-center text-center">
              <CheckCircle2 className="h-8 w-8 text-primary mb-3" />
              <p>Support premium dès le premier jour.</p>
            </div>
          </div>
          
          <div className="text-center">
            <Button size="lg" onClick={openDemoDialog} className="text-base px-8 py-6 h-auto gap-3">
              Réserver ma démo personnalisée
              <span className="inline-block">👉</span>
            </Button>
          </div>
        </div>
      </section>
      
      {/* FAQ Section */}
      <section className="py-16 px-6 md:px-10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            FAQ
          </h2>
          
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-subtle">
              <h3 className="font-bold text-lg mb-2">EduKeeper est-il sécurisé ?</h3>
              <p className="text-gray-600">Oui, vos données sont protégées par un chiffrement de niveau bancaire.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-subtle">
              <h3 className="font-bold text-lg mb-2">Combien de temps pour être opérationnel ?</h3>
              <p className="text-gray-600">Moins d'une journée. On configure tout pour vous.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-subtle">
              <h3 className="font-bold text-lg mb-2">Puis-je tester EduKeeper gratuitement ?</h3>
              <p className="text-gray-600">Bien sûr. Contactez-nous pour une démo gratuite et sans engagement.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer CTA */}
      <section className="py-16 px-6 md:px-10 bg-gray-800 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">
            Offrez à vos équipes une nouvelle façon de travailler
          </h2>
          <p className="text-lg mb-8">Plus rapide. Plus claire. Plus intelligente.</p>
          
          <Button size="lg" variant="secondary" onClick={openDemoDialog} className="text-primary font-bold text-base px-8 py-6 h-auto mb-8 gap-3">
            Demander ma démo gratuite maintenant
            <span className="inline-block">👉</span>
          </Button>
          
          <p>Ou contactez-nous directement : <a href="mailto:edukeeper.appli@gmail.com" className="underline hover:text-primary transition-colors">edukeeper.appli@gmail.com</a></p>
        </div>
      </section>

      {/* Demo request dialog */}
      <DemoRequestDialog open={isDemoDialogOpen} onOpenChange={setIsDemoDialogOpen} />
    </div>
  );
};

export default LandingPage;
