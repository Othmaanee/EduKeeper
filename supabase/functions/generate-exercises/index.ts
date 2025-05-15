
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.31.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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
    
    // Vérifier le mode d'entrée
    const { courseText, subject, level, format, numQuestions, includeSolutions, inputMode } = requestBody;
    console.log(`Génération d'exercices - Mode: ${inputMode}, Niveau: ${level}, Format: ${format}`);

    // Vérifier que les paramètres requis sont présents selon le mode
    if ((inputMode === 'text' && !courseText) || (inputMode === 'subject' && !subject)) {
      return new Response(
        JSON.stringify({ error: "Les paramètres requis sont manquants selon le mode de génération." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Création du prompt en fonction du mode d'entrée
    let prompt;
    if (inputMode === 'text') {
      prompt = `Vous êtes un professeur expérimenté. Créez ${numQuestions} exercices progressifs et complets avec leurs corrigés, adaptés au texte du cours suivant, avec un niveau de difficulté "${level}" et en format "${format}":

${courseText}

IMPORTANT - FORMAT : Utilisez uniquement un format de texte simple, sans balises LaTeX complexes ni code Markdown. 
Pour les fractions, utilisez la notation classique avec barre oblique (ex: 3/4 et non \\frac{3}{4}).
Pour les puissances, utilisez la notation avec chapeau (ex: x^2 et non x²).
Pour les racines carrées, écrivez "racine de" en toutes lettres.
Pour les équations, utilisez un format linéaire simple (ex: a + b = c et non des alignements complexes).

Le corrigé doit être clair, structuré et pédagogique, également dans un format texte simple.
Chaque exercice commence par "### Exercice [n]" et son corrigé commence par "### Corrigé [n]".

Assurez-vous que les exercices:
1. Correspondent parfaitement au contenu du cours fourni
2. Respectent la complexité demandée (${level})
3. Sont adaptés au format demandé (${format})
4. Utilisent le vocabulaire spécifique au domaine traité dans le cours
5. Sont rédigés en texte simple facilement lisible sur écran`;
    } else {
      prompt = `Vous êtes un professeur expérimenté. Créez ${numQuestions} exercices progressifs et complets avec leurs corrigés sur le sujet "${subject}", avec un niveau de difficulté "${level}" et en format "${format}".

IMPORTANT - FORMAT : Utilisez uniquement un format de texte simple, sans balises LaTeX complexes ni code Markdown. 
Pour les fractions, utilisez la notation classique avec barre oblique (ex: 3/4 et non \\frac{3}{4}).
Pour les puissances, utilisez la notation avec chapeau (ex: x^2 et non x²).
Pour les racines carrées, écrivez "racine de" en toutes lettres.
Pour les équations, utilisez un format linéaire simple (ex: a + b = c et non des alignements complexes).

${format === 'mixte' ? 
  "Puisque vous devez créer un format mixte, assurez-vous d'inclure une variété de types de questions: QCM, questions ouvertes, vrai/faux, etc." 
: `Respectez bien le format demandé (${format}).`}

Le corrigé doit être clair, structuré et pédagogique, également dans un format texte simple.
Chaque exercice commence par "### Exercice [n]" et son corrigé commence par "### Corrigé [n]".

Assurez-vous que les exercices:
1. Correspondent parfaitement au sujet demandé
2. Respectent la complexité demandée (${level})
3. Sont adaptés au sujet et au niveau scolaire approprié
4. Utilisent le vocabulaire spécifique au domaine traité
5. Sont rédigés en texte simple facilement lisible sur écran

Si le sujet est lié à un domaine scolaire spécifique, adaptez votre niveau de langage et de complexité en conséquence.`;
    }

    console.log(`Modèle utilisé: gpt-4o-mini`);
    console.log(`Envoi de la requête à OpenAI`);

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
        exercises: exercicesGeneres,
        inputMode: inputMode,
        source: inputMode === 'text' ? 'cours' : 'sujet',
        sourceValue: inputMode === 'text' ? courseText.substring(0, 50) + '...' : subject,
        level,
        format,
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
