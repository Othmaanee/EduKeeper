
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Vérifier si la méthode est OPTIONS (requête CORS preflight)
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Récupérer et valider la clé API OpenAI
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('Erreur: Clé API OpenAI manquante');
      return new Response(
        JSON.stringify({ error: 'Configuration de la clé API OpenAI manquante' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Extraire les données de la requête
    const { sujet, classe, specialite, difficulte } = await req.json();

    if (!sujet || !classe || !difficulte) {
      return new Response(
        JSON.stringify({ error: 'Paramètres manquants : sujet, classe et difficulté sont requis' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Génération d'un contrôle - Sujet: ${sujet}, Classe: ${classe}, Difficulté: ${difficulte}`);

    // Construction du prompt pour OpenAI
    let prompt = `Tu es un professeur expérimenté. Génère un contrôle d'entraînement pour un élève de niveau ${classe}, sur le sujet : "${sujet}"`;
    
    // Ajouter la spécialité si elle est fournie et n'est pas "aucune"
    if (specialite && specialite.trim() !== '' && specialite !== 'aucune') {
      prompt += `, spécialité : "${specialite}"`;
    }
    
    prompt += `.\n\nLe contrôle doit être adapté au niveau de difficulté suivant : ${difficulte}.\n\nDonne :\n- Un énoncé structuré\n- 3 à 10 questions pertinentes selon le niveau\n- Les corrigés à part ou directement après chaque question\n\nFormat clair, adapté à un élève qui révise seul.`;

    // Ajout de logs pour débugger
    console.log('Envoi de la requête à OpenAI avec le prompt:', prompt);
    console.log('Modèle utilisé:', "gpt-3.5-turbo");
    
    // Appel à l'API OpenAI
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Tu es un professeur expérimenté qui crée des contrôles d'entraînement clairs et pédagogiques."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
      }),
    });

    // Vérifier si la réponse est ok
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erreur OpenAI (${response.status}):`, errorText);
      return new Response(
        JSON.stringify({ 
          error: `Erreur lors de la génération du contrôle (${response.status})`,
          details: errorText
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Traiter la réponse
    const data = await response.json();
    const evaluation = data.choices[0]?.message?.content || "Désolé, impossible de générer le contrôle.";
    
    console.log('Réponse reçue d\'OpenAI, longueur du contenu:', evaluation.length);

    // Retourner les résultats
    return new Response(
      JSON.stringify({ evaluation }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Erreur dans la fonction generate-evaluation:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erreur inconnue lors de la génération du contrôle' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
