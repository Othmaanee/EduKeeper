
// @ts-ignore
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore
import "https://deno.land/x/xhr@0.3.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Gestion des requêtes OPTIONS pour CORS
async function handleOptions() {
  return new Response(null, {
    headers: corsHeaders,
    status: 204,
  })
}

serve(async (req) => {
  // Gérer les requêtes OPTIONS
  if (req.method === 'OPTIONS') {
    return handleOptions()
  }

  try {
    console.log("Auth Header:", req.headers.get('Authorization') ? "Present" : "Missing");
    
    // Vérifier le token d'authentification
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Authorization header missing')
    }

    // Extraire le texte du document de la requête
    const { documentText } = await req.json()
    
    if (!documentText || typeof documentText !== 'string') {
      throw new Error('Document text is required and must be a string')
    }
    
    // Limiter la taille du texte d'entrée si nécessaire
    const maxInputLength = 20000
    const truncatedText = documentText.length > maxInputLength 
      ? documentText.substring(0, maxInputLength) + "..." 
      : documentText
    
    console.log("Appel à l'API OpenAI...");
    
    // Appel à l'API OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Tu es un assistant spécialisé dans la création de résumés pédagogiques clairs et bien structurés.
            
Ta mission est de générer un résumé concis et informatif du document fourni, en respectant ces règles:
- Produis un résumé bien structuré avec une hiérarchie claire (titres, sous-titres si nécessaire)
- Utilise des paragraphes courts et séparés pour améliorer la lisibilité
- N'utilise PAS de '#' pour les titres mais utilise le formatage HTML (h1, h2, h3)
- Organise le contenu de façon logique et cohérente
- Identifie et inclus les concepts et points clés
- Garde un ton pédagogique et explicatif
- Veille à la clarté et à la précision
- Ajoute une conclusion synthétique`
          },
          {
            role: 'user',
            content: `Voici le document à résumer. Crée un résumé clair, structuré et facile à comprendre:\n\n${truncatedText}`
          }
        ],
        temperature: 0.2,
        max_tokens: 2000
      })
    });
    
    const openaiData = await openaiResponse.json();
    
    if (!openaiData.choices || openaiData.choices.length === 0) {
      console.error("Réponse OpenAI invalide:", openaiData);
      throw new Error('Invalid response from OpenAI API');
    }
    
    // Extraire le résumé
    const summary = openaiData.choices[0].message.content;
    
    // Faire une autre requête pour extraire les mots-clés
    const keywordsResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Tu es un assistant qui extrait des mots-clés pertinents de textes. Renvoie uniquement une liste de 5 à 10 mots-clés sans phrase d\'introduction ni commentaire. Sépare les mots-clés par des virgules.'
          },
          {
            role: 'user',
            content: `Voici le texte. Extrais-en les mots-clés importants:\n\n${summary}`
          }
        ],
        temperature: 0.2,
        max_tokens: 200
      })
    });
    
    const keywordsData = await keywordsResponse.json();
    let keywords: string[] = [];
    
    if (keywordsData.choices && keywordsData.choices.length > 0) {
      // Formater les mots-clés
      const keywordsString = keywordsData.choices[0].message.content.trim();
      keywords = keywordsString.split(',').map((kw: string) => kw.trim()).filter(Boolean);
    }
    
    // Renvoyer le résumé et les mots-clés
    return new Response(
      JSON.stringify({
        summary,
        keywords
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      }
    );
    
  } catch (error) {
    console.error(`Error processing request: ${error.message}`);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: error.message.includes('Authorization') ? 401 : 500,
      }
    );
  }
})
