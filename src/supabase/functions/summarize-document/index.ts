
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type DocumentRequest = {
  documentUrl: string;
  documentName: string;
  userRole: string;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { documentUrl, documentName, userRole } = await req.json() as DocumentRequest;
    
    if (!documentUrl) {
      return new Response(JSON.stringify({ error: 'Document URL is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get document content (this would typically make an HTTP request to the document URL)
    // For this example, since we would need to extract content from PDFs or other formats,
    // we'll simulate getting some content based on the document name.
    
    // Here we would normally extract content from the document URL.
    // Instead, we'll pass the document name to the AI API and ask it to summarize
    // a hypothetical document with this name.

    // Select the API key based on availability
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const groqApiKey = Deno.env.get('GROQ_API_KEY');
    
    let summary: string;
    
    // Choose which API to use based on available keys
    if (openaiApiKey) {
      summary = await generateSummaryWithOpenAI(documentName, userRole, openaiApiKey);
    } else if (groqApiKey) {
      summary = await generateSummaryWithGroq(documentName, userRole, groqApiKey);
    } else {
      throw new Error("No API key available for OpenAI or Groq");
    }

    // Return the summary
    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in summarize-document function:', error);
    return new Response(JSON.stringify({ error: error.message || 'An error occurred' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Function to generate a summary using OpenAI
async function generateSummaryWithOpenAI(docName: string, userRole: string, apiKey: string): Promise<string> {
  const isStudent = userRole === 'user';
  
  const prompt = isStudent 
    ? `Résume un document intitulé "${docName}" de façon pédagogique avec un langage simple. Inclus des exemples concrets et des explications adaptées pour un étudiant qui cherche à mieux comprendre ce sujet. Fais un résumé structuré en sections logiques.`
    : `Résume un document intitulé "${docName}" de façon professionnelle et synthétique. Ce résumé sera utilisé comme support pédagogique à distribuer aux élèves. Utilise un ton formel et va directement à l'essentiel tout en gardant les points clés.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system', 
          content: isStudent
            ? 'Tu es un tuteur pédagogique qui explique des concepts complexes avec simplicité, exemples et clarté pour les étudiants.'
            : 'Tu es un assistant professionnel qui crée des résumés synthétiques et efficaces pour des enseignants.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Error calling OpenAI API');
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// Function to generate a summary using Groq
async function generateSummaryWithGroq(docName: string, userRole: string, apiKey: string): Promise<string> {
  const isStudent = userRole === 'user';
  
  const prompt = isStudent 
    ? `Résume un document intitulé "${docName}" de façon pédagogique avec un langage simple. Inclus des exemples concrets et des explications adaptées pour un étudiant qui cherche à mieux comprendre ce sujet. Fais un résumé structuré en sections logiques.`
    : `Résume un document intitulé "${docName}" de façon professionnelle et synthétique. Ce résumé sera utilisé comme support pédagogique à distribuer aux élèves. Utilise un ton formel et va directement à l'essentiel tout en gardant les points clés.`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-sonar-small-128k-online',
      messages: [
        {
          role: 'system', 
          content: isStudent
            ? 'Tu es un tuteur pédagogique qui explique des concepts complexes avec simplicité, exemples et clarté pour les étudiants.'
            : 'Tu es un assistant professionnel qui crée des résumés synthétiques et efficaces pour des enseignants.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Error calling Groq API');
  }

  const data = await response.json();
  return data.choices[0].message.content;
}
