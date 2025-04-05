
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const groqApiKey = Deno.env.get('GROQ_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Fonction generate-course appelée");
    
    // Parse the request body safely
    let subject;
    try {
      const body = await req.json();
      subject = body.subject;
      console.log("Sujet reçu:", subject);
    } catch (parseError) {
      console.error('Erreur de parsing du JSON:', parseError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Format de requête invalide' 
        }),
        { 
          status: 400, 
          headers: corsHeaders
        }
      );
    }

    if (!subject) {
      console.error('Aucun sujet fourni');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Aucun sujet fourni' 
        }),
        { 
          status: 400, 
          headers: corsHeaders
        }
      );
    }

    console.log("Clé API Groq présente:", !!groqApiKey);
    if (!groqApiKey) {
      console.error('Clé API Groq manquante');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Clé API Groq manquante. Veuillez configurer la clé dans les secrets de la fonction Edge.' 
        }),
        { 
          status: 500, 
          headers: corsHeaders
        }
      );
    }

    const systemPrompt = "Tu es un professeur qui génère un cours clair et pédagogique.";

    try {
      console.log("Appel à l'API Groq...");
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Rédige un cours complet sur le sujet suivant: ${subject}` }
          ],
          temperature: 0.7,
        }),
      });

      // Handle API errors
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "Erreur de l'API Groq";
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error?.message || errorMessage;
        } catch (e) {
          // If we can't parse the error, use the raw text
          errorMessage = errorText || errorMessage;
        }
        
        console.error('Erreur API Groq:', errorMessage);
        
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Erreur API Groq: ${errorMessage}` 
          }),
          { 
            status: 500, 
            headers: corsHeaders
          }
        );
      }

      const data = await response.json();
      const courseContent = data.choices[0].message.content;
      console.log("Cours généré avec succès");

      return new Response(
        JSON.stringify({ 
          success: true, 
          content: courseContent 
        }),
        { headers: corsHeaders }
      );
    } catch (groqError) {
      console.error('Erreur lors de l\'appel à l\'API Groq:', groqError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: groqError.message || 'Erreur lors de la génération du cours' 
        }),
        { 
          status: 500, 
          headers: corsHeaders
        }
      );
    }
  } catch (error) {
    console.error('Erreur générale dans la fonction generate-course:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Une erreur inconnue est survenue' 
      }),
      { 
        status: 500, 
        headers: corsHeaders
      }
    );
  }
});
