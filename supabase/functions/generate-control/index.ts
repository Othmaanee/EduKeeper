
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import "https://deno.land/x/xhr@0.3.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    })
  }
  
  try {
    const { sujet, niveau, nbQuestions } = await req.json()
    
    if (!sujet || !niveau || !nbQuestions) {
      return new Response(
        JSON.stringify({ error: 'Sujet, niveau et nombre de questions requis' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }
    
    // S'assurer que le nombre de questions est un nombre entier
    const questionCount = parseInt(nbQuestions, 10) || 5
    
    console.log(`Génération d'un contrôle - Sujet: ${sujet}, Niveau: ${niveau}, Questions: ${questionCount}`)
    
    // Améliorer le prompt en fonction des critères spécifiques
    const prompt = `
    En tant que professeur de ${niveau}, tu dois créer un contrôle complet sur le thème: "${sujet}".
    
    Ce contrôle doit:
    - Contenir exactement ${questionCount} questions numérotées
    - Commencer par une introduction contextuelle sur le sujet
    - Présenter une difficulté progressive: questions simples au début, plus complexes à la fin
    - Inclure au moins 2 questions élaborées avec un contexte/situation problème (pour les questions finales)
    - Se terminer par un barème détaillé
    
    Format demandé:
    - Utiliser un titre principal avec le sujet du contrôle et le niveau
    - Structurer clairement les différentes parties
    - Format compatible avec la mise en forme HTML (sans utiliser de # pour les titres)
    - Indiquer une durée estimée
    
    Important:
    - Respecter le niveau scolaire ${niveau}
    - Donner des instructions précises pour chaque question 
    - Répartir les points et indiquer le barème
    - Créer EXACTEMENT ${questionCount} questions, pas une de plus ni de moins
    `;
    
    console.log("Envoi de la requête à OpenAI avec le prompt amélioré")
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system", 
            content: "Tu es un professeur expert qui crée des contrôles pédagogiques de haute qualité."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2500
      })
    })
    
    const data = await response.json()
    console.log("Réponse reçue d'OpenAI, longueur du contenu:", data.choices?.[0]?.message?.content?.length)
    
    const content = data.choices?.[0]?.message?.content
    
    if (!content) {
      throw new Error("La réponse de l'API ne contient pas de contenu valide")
    }
    
    // Nettoyer et formater le contenu avant de le renvoyer
    const formattedContent = content
      .replace(/^#\s+/gm, '<h1>') // Remplacer les # par des balises h1
      .replace(/^##\s+/gm, '<h2>') // Remplacer les ## par des balises h2
      .replace(/^###\s+/gm, '<h3>') // Remplacer les ### par des balises h3
      .replace(/\n\n/g, '</p><p>') // Ajouter des balises de paragraphe
    
    return new Response(
      JSON.stringify({ content: formattedContent }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
    
  } catch (error) {
    console.error("Erreur:", error.message)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
