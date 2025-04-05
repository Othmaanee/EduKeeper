
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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
    // Parse the request body safely
    let subject;
    try {
      const body = await req.json();
      subject = body.subject;
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

    const systemPrompt = `
      Tu es un professeur expert qui rédige des cours clairs et structurés.
      Crée un cours complet sur le sujet demandé.
      Organise le cours avec une introduction, plusieurs parties numérotées, et une conclusion.
      Chaque partie doit contenir des informations précises et pédagogiques.
      N'utilise pas de formatage markdown complexe, juste des paragraphes clairs.
    `;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
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
        let errorMessage = "Erreur de l'API OpenAI";
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error?.message || errorMessage;
        } catch (e) {
          // If we can't parse the error, use the raw text
          errorMessage = errorText || errorMessage;
        }
        
        console.error('Erreur API OpenAI:', errorMessage);
        
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Erreur API OpenAI: ${errorMessage}` 
          }),
          { 
            status: 500, 
            headers: corsHeaders
          }
        );
      }

      const data = await response.json();
      const courseContent = data.choices[0].message.content;

      return new Response(
        JSON.stringify({ 
          success: true, 
          content: courseContent 
        }),
        { headers: corsHeaders }
      );
    } catch (openaiError) {
      console.error('Erreur lors de l\'appel à l\'API OpenAI:', openaiError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: openaiError.message || 'Erreur lors de la génération du cours' 
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
