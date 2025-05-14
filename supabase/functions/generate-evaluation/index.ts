
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.31.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Gérer les requêtes CORS preflight OPTIONS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Récupérer le token d'authentification
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authentification requise" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Récupérer les variables d'environnement
    const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAIApiKey) {
      return new Response(
        JSON.stringify({ error: "Configuration incomplète: API OpenAI" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse le corps de la requête
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (error) {
      return new Response(
        JSON.stringify({ error: "Format de requête invalide" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { sujet, classe, specialite = "aucune", difficulte = "Moyen" } = requestBody;

    if (!sujet || !classe) {
      return new Response(
        JSON.stringify({ error: "Les paramètres sujet et classe sont requis" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Adaptation du format d'évaluation en fonction du niveau scolaire
    let formatEvaluation = "";
    const niveauScolaire = classe.toLowerCase();
    
    if (["6e", "5e"].includes(niveauScolaire)) {
      // Primaire et début de collège
      formatEvaluation = `
      - Privilégier les QCM et exercices à trous
      - Inclure des illustrations simples
      - Utiliser un langage simple et direct
      - 4-5 questions courtes avec barèmes clairs
      - Corrigés détaillés avec démarche étape par étape`;
    } else if (["4e", "3e"].includes(niveauScolaire)) {
      // Fin de collège
      formatEvaluation = `
      - Équilibrer QCM et questions ouvertes
      - Inclure au moins un exercice de réflexion
      - 5-6 questions avec difficulté progressive
      - Barème sur 20 points avec répartition équilibrée
      - Corrigés avec explications des raisonnements`;
    } else if (["2nde", "1ere", "terminale"].includes(niveauScolaire)) {
      // Lycée
      formatEvaluation = `
      - Privilégier les questions à développement
      - Inclure un exercice de synthèse/dissertation
      - 4-6 questions dont certaines complexes
      - Évaluer les capacités d'analyse et d'argumentation
      - Structure avec partie théorique et partie pratique
      - Barème détaillé valorisant la méthode`;
    } else {
      // Format par défaut pour les autres niveaux
      formatEvaluation = `
      - 5-6 questions variées
      - Difficulté progressive
      - Barème équilibré sur 20 points
      - Corrigés pour chaque question`;
    }

    // Ajustement en fonction de la difficulté demandée
    let ajustementDifficulte = "";
    if (difficulte.toLowerCase().includes("base") || difficulte.toLowerCase() === "facile") {
      ajustementDifficulte = "Niveau facile: se concentrer sur les connaissances fondamentales et les exercices d'application directe.";
    } else if (difficulte.toLowerCase().includes("complet") || difficulte.toLowerCase() === "difficile") {
      ajustementDifficulte = "Niveau difficile: inclure des questions qui nécessitent réflexion, analyse et synthèse de plusieurs concepts.";
    } else {
      ajustementDifficulte = "Niveau intermédiaire: équilibrer exercices d'application et questions de réflexion.";
    }

    // Construire le prompt pour l'API OpenAI
    const prompt = `Vous êtes un professeur expérimenté. Créez un contrôle complet avec corrigé pour une classe de ${classe} sur le sujet "${sujet}"${specialite !== "aucune" ? ` en spécialité ${specialite}` : ""}.

INSTRUCTIONS SPÉCIFIQUES POUR CE NIVEAU SCOLAIRE:
${formatEvaluation}

NIVEAU DE DIFFICULTÉ: 
${ajustementDifficulte}

FORMAT:
- Le contrôle doit commencer par un titre centré
- Le barème doit être indiqué pour chaque question (total 20 points)
- Les questions doivent être numérotées et clairement séparées
- Les questions doivent être progressives en difficulté
- Utilisez des formulations claires et adaptées à l'âge des élèves
- Utilisez des **astérisques doubles** pour mettre en gras les éléments importants

STRUCTURE:
1. Un titre clair incluant le sujet et le niveau
2. Une introduction brève au sujet du contrôle
3. Entre 4 et 6 questions comportant des sous-questions si nécessaire
4. Un corrigé détaillé de chaque question à la fin

IMPORTANT: Créez un contenu complet, détaillé, et qui reproduit fidèlement la structure d'un contrôle réel pour le niveau ${classe}, avec le niveau de difficulté ${difficulte}.`;

    console.log("Envoi de la requête à OpenAI...");

    // Appel à l'API OpenAI
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erreur OpenAI (${response.status}):`, errorText);
      return new Response(
        JSON.stringify({
          error: `Erreur API: ${response.status}`,
          details: errorText,
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Traiter la réponse
    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      return new Response(
        JSON.stringify({ error: "Réponse OpenAI invalide" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const evaluationContent = data.choices[0].message.content;

    return new Response(
      JSON.stringify({
        evaluation: evaluationContent,
        sujet,
        classe,
        difficulte,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erreur dans la fonction generate-evaluation:", error);
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
