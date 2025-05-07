
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
    const { documentUrl, documentText, role } = await req.json();
    
    console.log("Received request with role:", role);

    // Check if we have documentText directly provided or if we need to fetch it from URL
    let textToSummarize = documentText;
    
    // If documentText is not provided but URL is, try to fetch the content
    if (!textToSummarize && documentUrl) {
      console.log(`Fetching document content from URL: ${documentUrl}`);
      try {
        const response = await fetch(documentUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch document: ${response.status} ${response.statusText}`);
        }
        textToSummarize = await response.text();
      } catch (error) {
        console.error("Error fetching document from URL:", error);
        return new Response(
          JSON.stringify({ success: false, error: "Impossible de récupérer le contenu du document" }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
    }

    // Validate inputs
    if (!textToSummarize) {
      return new Response(
        JSON.stringify({ success: false, error: "Le texte du document est requis ou l'URL n'est pas valide" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Clean up and validate the role
    const cleanRole = typeof role === 'string' ? 
      role.replace(/['"]/g, '').trim() : // Remove quotes and trim whitespace
      'user'; // Default to user if role is not provided or not a string

    console.log("Cleaned role:", cleanRole);

    // Select the appropriate prompt based on user role
    let systemPrompt = "";
    if (cleanRole === "user" || cleanRole === "eleve") {
      systemPrompt = "Tu es un assistant qui résume les textes en français.";
    } else if (cleanRole === "enseignant") {
      systemPrompt = "Rédige un résumé professionnel, clair et synthétique de ce texte, adapté pour un support pédagogique.";
    } else {
      console.error("Invalid role after cleaning:", cleanRole);
      return new Response(
        JSON.stringify({ success: false, error: "Rôle non valide: " + cleanRole }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Check if we have API keys available
    if (!openAIApiKey && !groqApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "Aucune clé API disponible (OpenAI ou Groq)" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    let summary = "";
    let apiUsed = "";

    // Try OpenAI first if key is available
    if (openAIApiKey) {
      try {
        console.log(`Trying OpenAI API with model: gpt-3.5-turbo`);
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `Résume ce texte : ${textToSummarize}` }
            ],
            temperature: 0.5,
            max_tokens: 1500,
          }),
        });

        // Check if the API call was successful
        if (!response.ok) {
          const responseText = await response.text();
          console.error("OpenAI API error:", responseText);
          
          let error;
          try {
            error = JSON.parse(responseText);
          } catch (e) {
            error = { error: { message: responseText || "Unknown error" } };
          }
          
          throw new Error(`Erreur API OpenAI: ${error.error?.message || "Échec de la génération du résumé"}`);
        }

        // Parse the response from OpenAI
        const data = await response.json();
        summary = data.choices[0].message.content;
        apiUsed = "OpenAI";
        console.log("Successfully generated summary with OpenAI");

      } catch (error) {
        console.error("Error with OpenAI API:", error);
        
        // If OpenAI fails and we have Groq key, try with Groq
        if (groqApiKey) {
          console.log("OpenAI failed, trying Groq API as fallback...");
        } else {
          throw error; // Re-throw if no Groq API key
        }
      }
    }

    // If summary is not yet generated and Groq key is available, use Groq
    if (!summary && groqApiKey) {
      try {
        console.log(`Using Groq API as fallback with model: llama3-8b-8192`);
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${groqApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama3-8b-8192', // Groq's model
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `Résume ce texte : ${textToSummarize}` }
            ],
            temperature: 0.5,
            max_tokens: 1500,
          }),
        });

        // Check if the API call was successful
        if (!response.ok) {
          const responseText = await response.text();
          console.error("Groq API error:", responseText);
          
          let error;
          try {
            error = JSON.parse(responseText);
          } catch (e) {
            error = { error: { message: responseText || "Unknown error" } };
          }
          
          throw new Error(`Erreur API Groq: ${error.error?.message || "Échec de la génération du résumé"}`);
        }

        // Parse the response from Groq
        const data = await response.json();
        summary = data.choices[0].message.content;
        apiUsed = "Groq";
        console.log("Successfully generated summary with Groq");
        
      } catch (error) {
        console.error("Error with Groq API:", error);
        throw error;
      }
    }

    // Return the summary
    console.log(`Summary successfully generated using ${apiUsed} API`);
    return new Response(
      JSON.stringify({ success: true, summary, apiUsed }),
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
