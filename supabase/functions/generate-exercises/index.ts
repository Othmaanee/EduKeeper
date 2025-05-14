
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.31.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Récupérer les informations d'authentification
    const authHeader = req.headers.get("Authorization");
    
    // Vérifier si l'en-tête d'autorisation est présent
    if (!authHeader) {
      console.error("En-tête d'autorisation manquant");
      return new Response(
        JSON.stringify({ error: "Authentification requise" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Obtenir les variables d'environnement
    const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!openAIApiKey) {
      console.error("Clé API OpenAI manquante");
      return new Response(
        JSON.stringify({ error: "Configuration incomplète: API OpenAI" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse JSON de la requête
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      console.error("Erreur lors du parsing de la requête JSON:", parseError);
      return new Response(
        JSON.stringify({ error: "Format de requête invalide" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    const { sujet, classe, niveau } = requestBody;
    console.log(`Génération d'exercices - Sujet: ${sujet}, Classe: ${classe}, Niveau: ${niveau}`);

    if (!sujet || !classe || !niveau) {
      return new Response(
        JSON.stringify({ error: "Les paramètres sujet, classe et niveau sont requis." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Déterminer les instructions spécifiques en fonction de la classe
    let instructionsSpecifiques = "";
    const niveauScolaire = classe.toLowerCase();
    
    if (["6e", "5e", "4e", "3e"].includes(niveauScolaire)) {
      // Collège
      instructionsSpecifiques = `
- Utilisez un vocabulaire adapté aux élèves de ${classe}
- Privilégiez des QCM et des questions à réponses courtes
- Évitez les concepts trop abstraits
- Utilisez des exemples concrets et ludiques
- Limitez la complexité mathématique à ce qui est étudié en ${classe}`;
    } else if (["2nde", "1ere", "premiere", "1ère"].includes(niveauScolaire)) {
      // Lycée (2nde, 1ère)
      instructionsSpecifiques = `
- Adaptez le contenu au programme de ${classe}
- Équilibrez QCM et questions à développement
- Introduisez des concepts qui demandent réflexion
- Ajoutez des questions qui nécessitent une analyse critique
- Utilisez le vocabulaire technique approprié pour ce niveau`;
    } else if (["terminale", "term"].includes(niveauScolaire)) {
      // Terminale
      instructionsSpecifiques = `
- Adoptez un niveau correspondant aux exigences du baccalauréat
- Favorisez les questions à développement et l'analyse approfondie
- Incluez des questions qui demandent une synthèse de plusieurs notions
- Utilisez le vocabulaire technique précis de la discipline
- Proposez des exercices qui préparent aux études supérieures`;
    }

    // Création du prompt amélioré pour OpenAI avec instructions spécifiques sur le formatage
    const prompt = `Vous êtes un professeur expérimenté. Créez 5 exercices progressifs et complets avec leurs corrigés, adaptés à une classe de ${classe} en fonction du sujet "${sujet}" et du niveau "${niveau}" :
- Niveau "Bases" : exercices simples, notions fondamentales
- Niveau "Classique" : exercices standards, adaptés à des évaluations de mi-parcours
- Niveau "Très complet" : exercices complexes, croisant plusieurs notions du programme de ${classe}

${instructionsSpecifiques}

IMPORTANT - FORMAT : Utilisez uniquement un format de texte simple, sans balises LaTeX complexes ni code Markdown. 
Pour les fractions, utilisez la notation classique avec barre oblique (ex: 3/4 et non \\frac{3}{4}).
Pour les puissances, utilisez la notation avec chapeau (ex: x^2 et non x²).
Pour les racines carrées, écrivez "racine de" en toutes lettres.
Pour les équations, utilisez un format linéaire simple (ex: a + b = c et non des alignements complexes).

Exemples de format approuvés :
- "Calculer : 4/11 + 3/11 = ..."
- "Résoudre l'équation : 2x + 3 = 7"
- "Simplifier : (x^2 + 3x) / x"

Le corrigé doit être clair, structuré et pédagogique, également dans un format texte simple.
Chaque exercice commence par "### Exercice [n]" et son corrigé commence par "### Corrigé [n]".

Assurez-vous que les exercices:
1. Correspondent parfaitement au niveau scolaire de ${classe}
2. Respectent la complexité demandée (${niveau})
3. Sont adaptés aux connaissances typiques à ce stade de l'année scolaire
4. Utilisent le vocabulaire et les méthodes spécifiques au programme officiel de ${classe}
5. Sont rédigés en texte simple facilement lisible sur écran`;

    console.log(`Modèle utilisé: gpt-4o-mini`);
    console.log(`Envoi de la requête à OpenAI avec le prompt amélioré`);

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
        temperature: 0.7, // Légère augmentation pour plus de créativité dans les exercices
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erreur OpenAI (${response.status}):`, errorText);
      return new Response(
        JSON.stringify({ 
          error: `Erreur API: ${response.status}`,
          details: errorText
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse la réponse
    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error("Erreur lors du parsing de la réponse OpenAI:", jsonError);
      const rawResponse = await response.text();
      console.error("Réponse brute:", rawResponse);
      return new Response(
        JSON.stringify({ error: "Impossible de parser la réponse de l'API" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    console.log(`Réponse reçue d'OpenAI, longueur du contenu: ${data.choices[0]?.message?.content?.length || 0}`);

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("Réponse OpenAI invalide:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: "Erreur lors de la génération des exercices." }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const exercicesGeneres = data.choices[0].message.content;

    return new Response(
      JSON.stringify({
        exercices: exercicesGeneres,
        sujet: sujet,
        classe: classe,
        niveau: niveau,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erreur dans la fonction generate-exercises:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
