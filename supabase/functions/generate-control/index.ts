
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
      console.error("Erreur d'authentification:", authError?.message || "Utilisateur non authentifié");
      return new Response(
        JSON.stringify({ error: "Authentication error" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { subject, level, questionCount } = await req.json();
    
    console.log(`Génération d'un contrôle - Sujet: ${subject}, Niveau: ${level}, Questions: ${questionCount}`);

    // Improved prompt for better control generation
    const prompt = `Génère un contrôle de mathématiques sur le sujet "${subject}" pour un niveau ${level}. 
    
1. Le contrôle doit contenir EXACTEMENT ${questionCount} questions numérotées clairement (pas une de moins).
2. Au moins 2 questions doivent être des questions complexes avec un contexte complet et plusieurs sous-parties.
3. Les questions doivent être variées en termes de difficulté : commencer avec des questions simples et progresser vers des problèmes plus difficiles.
4. Chaque question doit avoir un énoncé clair et un corrigé détaillé.
5. Format de sortie : utilise une structure en markdown bien organisée avec des titres clairs "## Question X" et "## Corrigé" sans ajouter des # excessifs.

Types de questions à inclure :
- Questions de calcul de base
- Questions d'application directe de formules
- Questions de démonstration
- Problèmes contextualisés (ex: problèmes concrets)
- Au moins une question qui demande une justification ou un raisonnement complet

Niveau de détail:
- Très détaillé et complet, exactement comme un vrai contrôle scolaire
- Toutes les formules mathématiques doivent être claires et bien écrites`;

    // Check if OpenAI API key is available
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key is missing" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Envoi de la requête à OpenAI avec le prompt amélioré");

    // Make request to OpenAI API
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Tu es un professeur de mathématiques expert qui crée des contrôles de qualité adaptés au niveau scolaire demandé." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error(`Erreur OpenAI (${openaiResponse.status}):`, errorText);
      return new Response(
        JSON.stringify({ error: `OpenAI API error: ${openaiResponse.status}`, details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const responseData = await openaiResponse.json();
    const controlContent = responseData.choices[0]?.message?.content || "";
    
    console.log("Réponse reçue d'OpenAI, longueur du contenu:", controlContent.length);

    // Create document in the database
    const documentName = `Contrôle : ${subject} (${level})`;
    const { data: document, error: documentError } = await supabase
      .from("documents")
      .insert([
        {
          nom: documentName,
          content: controlContent,
          user_id: user.id,
        },
      ])
      .select()
      .single();

    if (documentError) {
      console.error("Error creating document:", documentError);
      return new Response(
        JSON.stringify({ error: "Failed to save control", details: documentError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Record XP for generating control
    const { error: historyError } = await supabase
      .from('history')
      .insert({
        user_id: user.id,
        action_type: 'generate_control',
        document_name: documentName,
        xp_gained: 20
      });

    if (historyError) {
      console.error("Error recording XP history:", historyError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        control: controlContent,
        documentId: document.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-control function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
