
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
    let requestData;
    try {
      requestData = await req.json();
    } catch (parseError) {
      console.error("Erreur de parsing JSON de la requête:", parseError.message);
      return new Response(
        JSON.stringify({ error: "Format de requête invalide" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { topic, level, quantity } = requestData;

    if (!topic || !level) {
      return new Response(
        JSON.stringify({ error: 'Paramètres manquants : sujet et niveau sont requis' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Génération d'un contrôle - Sujet: ${topic}, Niveau: ${level}, Questions: ${quantity}`);

    // Construction du prompt amélioré pour OpenAI
    const prompt = `Tu es un professeur expert dans la création de contrôles et évaluations pédagogiques. Génère un contrôle complet de niveau "${level}" sur le thème "${topic}".

Ce contrôle doit contenir ${quantity || 5} questions au total, avec la structure suivante :
1. Un titre et une introduction claire
2. Les questions doivent être variées et comprendre :
   - Des questions courtes de connaissances (QCM, vrai/faux, définitions...)
   - Au moins ${Math.max(1, Math.floor((quantity || 5) / 3))} question(s) à développement long avec un énoncé structuré
   - Au moins ${Math.max(1, Math.floor((quantity || 5) / 4))} exercice(s) d'application pratique complexe(s)
3. Des énoncés clairs et complets pour chaque question
4. Le barème de notation pour chaque question
5. Des corrigés détaillés et pédagogiques pour toutes les questions
6. Des conseils pour la résolution des questions difficiles

Adapte rigoureusement la complexité au niveau "${level}" indiqué. Le document final doit être bien structuré, avec une typographie claire et une organisation qui facilite l'utilisation par l'élève qui travaille en autonomie.`;

    console.log('Envoi de la requête à OpenAI avec le prompt amélioré');
    
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
            content: "Tu es un professeur expérimenté qui crée des contrôles d'entraînement complets, structurés et adaptés au niveau demandé. Tu fournis des questions variées incluant des problèmes élaborés et leurs corrections détaillées."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2500,
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
    const control = data.choices[0]?.message?.content || "Désolé, impossible de générer le contrôle.";
    
    console.log('Réponse reçue d\'OpenAI, longueur du contenu:', control.length);

    // Retourner les résultats dans un format JSON valide
    return new Response(
      JSON.stringify({ 
        control,
        topic,
        level,
        quantity 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Erreur dans la fonction generate-control:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erreur inconnue lors de la génération du contrôle' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
