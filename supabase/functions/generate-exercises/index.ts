
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create authenticated Supabase client
    const authHeader = req.headers.get('Authorization');
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader || "" } } }
    );

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Authentication error" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { difficultyLevel, format, inputMode, inputText } = await req.json();
    
    console.log(`Génération d'exercices - Mode: ${inputMode}, Niveau: ${difficultyLevel}, Format: ${format}`);
    
    // Select model
    const model = "gpt-4o-mini";
    console.log(`Modèle utilisé: ${model}`);

    // Create the instruction for the AI based on request parameters
    let prompt = "";
    
    if (inputMode === 'text' && inputText) {
      // Mode texte: générer des exercices à partir d'un texte fourni
      prompt = `Utilise le texte suivant comme base pour générer des exercices d'entraînement de niveau ${difficultyLevel} :
      
${inputText}

Génère des exercices adaptés au contexte du texte fourni avec le format ${format}.`;
    } else if (inputMode === 'subject') {
      // Mode sujet: générer des exercices sur un sujet spécifique
      prompt = `Crée une série complète d'exercices de mathématiques sur le sujet "${inputText}" avec des difficultés ${difficultyLevel}.

Les exercices doivent être au format ${format}.`;
    } else {
      return new Response(
        JSON.stringify({ error: "Mode d'entrée ou texte invalide" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Add instructions based on format
    if (format === 'qcm') {
      prompt += `
Format: QCM avec 4 options par question, une seule correcte.
Inclus:
- Au moins 5 questions
- Corrigé détaillé pour chaque question
- Pour chaque question, indique la bonne réponse
- Utilise une mise en forme soignée et claire`;
    } else if (format === 'vrai_faux') {
      prompt += `
Format: Vrai/Faux
Inclus:
- Au moins 8 affirmations 
- Pour chaque affirmation, précise si elle est vraie ou fausse
- Explique pourquoi chaque affirmation est vraie ou fausse
- Utilise une mise en forme soignée et claire`;
    } else if (format === 'questions_ouvertes') {
      prompt += `
Format: Questions ouvertes
Inclus:
- Au moins 5 questions détaillées
- Corrigé complet et détaillé pour chaque question
- Questions variées en complexité
- Utilise une mise en forme soignée`;
    }
    
    // Add difficulty level specifics
    if (difficultyLevel === 'facile') {
      prompt += `
Niveau: FACILE - Adapté pour des débutants ou pour une première évaluation.
- Questions simples et directes
- Avec guidage clair`;
    } else if (difficultyLevel === 'moyen') {
      prompt += `
Niveau: MOYEN - Questions plus élaborées nécessitant une bonne compréhension.
- Inclure des questions nécessitant plusieurs étapes de raisonnement
- Varier les types de questions`;
    } else if (difficultyLevel === 'difficile') {
      prompt += `
Niveau: DIFFICILE - Questions avancées pour tester une maîtrise approfondie.
- Inclure des problèmes complexes
- Questions nécessitant une analyse poussée
- Au moins une question avec un cas pratique ou contextualisé`;
    }

    // Add formatting instructions
    prompt += `
Présentation:
- Utilise des titres clairs (## pour les sections principales, ### pour les sous-sections)
- Structure bien les exercices avec une numérotation claire
- Formate proprement le texte pour une bonne lisibilité
- Évite d'utiliser trop de caractères # dans le formatage`;

    console.log("Envoi de la requête à OpenAI");

    // Call OpenAI API
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("OPENAI_API_KEY") || ""}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "system",
            content: "Tu es un professeur expert spécialisé dans la création d'exercices pédagogiques adaptés au niveau demandé. Ta mission est de créer des exercices clairs, bien structurés et formatés."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      }),
    });

    if (!openaiResponse.ok) {
      const errorBody = await openaiResponse.text();
      console.error(`OpenAI API error (${openaiResponse.status}):`, errorBody);
      return new Response(
        JSON.stringify({ error: `API error: ${openaiResponse.status}`, details: errorBody }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const openaiData = await openaiResponse.json();
    const exercisesContent = openaiData.choices[0]?.message?.content || "";
    
    console.log("Réponse reçue d'OpenAI, longueur du contenu:", exercisesContent.length);
    
    // Format document name based on mode and input
    let documentName = "";
    if (inputMode === 'subject') {
      documentName = `Exercices : ${inputText} (${difficultyLevel})`;
    } else {
      documentName = `Exercices ${difficultyLevel} - ${new Date().toLocaleDateString("fr-FR")}`;
    }

    // Save document to database
    const { data: document, error: documentError } = await supabase
      .from("documents")
      .insert({
        nom: documentName,
        content: exercisesContent,
        user_id: user.id,
      })
      .select()
      .single();

    if (documentError) {
      console.error("Error creating document:", documentError);
      return new Response(
        JSON.stringify({ error: "Failed to save exercises", details: documentError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Add XP for generating exercises
    const { error: historyError } = await supabase
      .from('history')
      .insert({
        user_id: user.id,
        action_type: 'generate_exercises',
        document_name: documentName,
        xp_gained: 15
      });

    if (historyError) {
      console.error("Error recording XP history:", historyError);
      // Non-blocking, continue execution
    }

    return new Response(
      JSON.stringify({
        success: true,
        exercises: exercisesContent,
        documentId: document.id
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-exercises function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
