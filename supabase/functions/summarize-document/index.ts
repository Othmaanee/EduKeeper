
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const groqApiKey = Deno.env.get('GROQ_API_KEY'); // In case we want to use Groq as an alternative

// CORS headers to ensure the function can be called from the web app
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
    // Parse the request body
    const { documentText, role } = await req.json();

    // Validate inputs
    if (!documentText) {
      return new Response(
        JSON.stringify({ success: false, error: "Le texte du document est requis" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Select the appropriate prompt based on user role
    let systemPrompt = "";
    if (role === "user" || role === "eleve") {
      systemPrompt = "Résume ce texte pour un élève avec des mots simples et des exemples pour faciliter la compréhension.";
    } else if (role === "enseignant") {
      systemPrompt = "Rédige un résumé professionnel, clair et synthétique de ce texte, adapté pour un support pédagogique.";
    } else {
      return new Response(
        JSON.stringify({ success: false, error: "Rôle non valide" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Call OpenAI API to generate the summary
    console.log(`Calling OpenAI API with role: ${role}`);
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: documentText }
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    // Check if the API call was successful
    if (!response.ok) {
      const error = await response.json();
      console.error("OpenAI API error:", error);
      throw new Error(`Erreur API: ${error.error?.message || "Échec de la génération du résumé"}`);
    }

    // Parse the response from OpenAI
    const data = await response.json();
    const summary = data.choices[0].message.content;

    // Return the summary
    return new Response(
      JSON.stringify({ success: true, summary }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in summarize-document function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Une erreur est survenue lors de la génération du résumé" }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
