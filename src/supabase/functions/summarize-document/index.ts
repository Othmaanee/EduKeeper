
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { documentUrl, userRole } = await req.json();

    if (!documentUrl) {
      throw new Error('Document URL is required');
    }

    // Get the appropriate API key based on availability
    const openAiKey = Deno.env.get('OPENAI_API_KEY') || "";
    const groqKey = Deno.env.get('GROQ_API_KEY') || "";

    let apiEndpoint;
    let requestBody;
    let headers;
    let apiKey;

    if (openAiKey) {
      apiKey = openAiKey;
      apiEndpoint = 'https://api.openai.com/v1/chat/completions';
      headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      };
      
      const prompt = userRole === 'enseignant' 
        ? `Vous êtes un assistant professionnel spécialisé en éducation. Vous devez résumer de manière professionnelle et synthétique le document suivant pour un enseignant. Structurez votre résumé de façon claire et concise. Document: ${documentUrl}`
        : `Tu es un assistant pédagogique sympathique pour les élèves. Résume le document suivant de façon simple et claire avec des exemples pédagogiques adaptés au niveau collège-lycée. Utilise un langage accessible et des explications faciles à comprendre. Document: ${documentUrl}`;

      requestBody = JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Vous êtes un assistant spécialisé dans la création de résumés pédagogiques.' },
          { role: 'user', content: prompt }
        ],
      });
    } else if (groqKey) {
      apiKey = groqKey;
      apiEndpoint = 'https://api.groq.com/openai/v1/chat/completions';
      headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      };
      
      const prompt = userRole === 'enseignant' 
        ? `Vous êtes un assistant professionnel spécialisé en éducation. Vous devez résumer de manière professionnelle et synthétique le document suivant pour un enseignant. Structurez votre résumé de façon claire et concise. Document: ${documentUrl}`
        : `Tu es un assistant pédagogique sympathique pour les élèves. Résume le document suivant de façon simple et claire avec des exemples pédagogiques adaptés au niveau collège-lycée. Utilise un langage accessible et des explications faciles à comprendre. Document: ${documentUrl}`;

      requestBody = JSON.stringify({
        model: 'llama-3.1-70b-versatile',
        messages: [
          { role: 'system', content: 'Vous êtes un assistant spécialisé dans la création de résumés pédagogiques.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1000
      });
    } else {
      return new Response(
        JSON.stringify({ error: 'No API key available for OpenAI or Groq' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers,
      body: requestBody,
    });

    const data = await response.json();
    const summary = data.choices[0].message.content;

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in summarize-document function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
