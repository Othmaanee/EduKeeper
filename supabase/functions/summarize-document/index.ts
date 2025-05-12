
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Gestion des requêtes CORS preflight OPTIONS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Créer un client Supabase pour accéder aux fonctionnalités protégées
    const authHeader = req.headers.get("Authorization")!;
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Vérifier que l'utilisateur est authentifié
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Utilisateur non authentifié" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Récupérer les données de la requête
    const { documentText } = await req.json();

    if (!documentText || typeof documentText !== "string") {
      return new Response(
        JSON.stringify({ error: "Texte du document manquant ou invalide" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Vérifier que la clé API OpenAI est disponible
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      console.error("OPENAI_API_KEY non définie dans les variables d'environnement");
      return new Response(
        JSON.stringify({ error: "Configuration API manquante" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Appel à l'API OpenAI...");

    // Appel direct à l'API OpenAI avec fetch
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Voici un texte d'élève. Génère un résumé de 10 lignes maximum qui l'aide à réviser."
          },
          {
            role: "user",
            content: documentText
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      })
    });

    // Logging de la réponse en cas d'erreur
    if (!response.ok) {
      console.error(`Erreur OpenAI (${response.status}): ${await response.text()}`);
      return new Response(
        JSON.stringify({ error: `L'API OpenAI a retourné une erreur: ${response.status}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Traiter la réponse JSON
    const data = await response.json();
    
    // Extraire le texte du résumé de la réponse
    const summaryText = data.choices[0]?.message?.content || "";

    return new Response(
      JSON.stringify({ 
        success: true, 
        summary: summaryText, 
        apiUsed: "OpenAI"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Erreur:", error.message);
    return new Response(
      JSON.stringify({ error: `Erreur lors de la génération du résumé: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
