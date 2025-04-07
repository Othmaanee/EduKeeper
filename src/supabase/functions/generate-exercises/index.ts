
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
    const { 
      documentUrl, 
      userRole, 
      freeFormTopic, 
      exerciseCount, 
      exerciseType,
      educationLevel
    } = await req.json();

    if (!documentUrl && !freeFormTopic) {
      throw new Error('Either document URL or free-form topic is required');
    }

    // Get the appropriate API key based on availability
    const openAiKey = Deno.env.get('OPENAI_API_KEY') || "";
    const groqKey = Deno.env.get('GROQ_API_KEY') || "";

    let apiEndpoint;
    let requestBody;
    let headers;
    let apiKey;

    // Prepare the appropriate prompt based on input
    let prompt = "";
    if (documentUrl) {
      // For document-based exercises
      prompt = `Créer ${exerciseCount} exercices ${exerciseType === 'simple' ? 'simples et courts' : 'complets et approfondis'} basés sur ce document: ${documentUrl}. `;
      prompt += userRole === 'enseignant' 
        ? "Format professionnel adapté pour distribution aux élèves." 
        : "Format accessible avec explications claires pour aider à la compréhension.";
    } else {
      // For free-form topic
      prompt = `Créer ${exerciseCount} exercices ${exerciseType === 'simple' ? 'simples et courts' : 'complets et approfondis'} sur le sujet suivant: ${freeFormTopic}. `;
      prompt += `Niveau: ${educationLevel}. `;
      prompt += userRole === 'enseignant' 
        ? "Format professionnel adapté pour distribution aux élèves." 
        : "Format accessible avec explications claires pour aider à la compréhension.";
    }
    
    // Format the exercises consistently for parsing on frontend
    prompt += " Numérotez clairement chaque exercice. Incluez des questions et des espaces pour les réponses.";

    if (openAiKey) {
      apiKey = openAiKey;
      apiEndpoint = 'https://api.openai.com/v1/chat/completions';
      headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      };
      
      requestBody = JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'Vous êtes un assistant pédagogique spécialisé dans la création d\'exercices éducatifs adaptés au niveau demandé.' 
          },
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
      
      requestBody = JSON.stringify({
        model: 'llama-3.1-70b-versatile',
        messages: [
          { 
            role: 'system', 
            content: 'Vous êtes un assistant pédagogique spécialisé dans la création d\'exercices éducatifs adaptés au niveau demandé.' 
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 2000
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
    const exercises = data.choices[0].message.content;

    return new Response(JSON.stringify({ exercises }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-exercises function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
