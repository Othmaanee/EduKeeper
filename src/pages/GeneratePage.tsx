import React from "react";
import { Layout } from "@/components/Layout";
import { ComingSoonOverlay } from "@/components/ComingSoonOverlay";

const GeneratePage = () => {
  return (
    <Layout>
      <div className="container py-6 relative">
        <ComingSoonOverlay message="Fonctionnalité bientôt disponible." />
        
        <h1 className="text-2xl font-bold mb-2">Générer un cours</h1>
        <p className="text-muted-foreground mb-6">
          Créez des contenus de cours personnalisés en quelques clics.
        </p>
        
        {/* Le contenu de cette page sera développé ultérieurement */}
        <div className="grid gap-6">
          {/* Espace réservé pour le futur contenu */}
        </div>
      </div>
    </Layout>
  );
};

export default GeneratePage;
