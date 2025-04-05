
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { subject } = await req.json();

    if (!subject) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Aucun sujet fourni' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
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

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`Erreur API OpenAI: ${data.error?.message || 'Erreur inconnue'}`);
    }

    const courseContent = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ 
        success: true, 
        content: courseContent 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Erreur dans la fonction generate-course:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Une erreur inconnue est survenue' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
