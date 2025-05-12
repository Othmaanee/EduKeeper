
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Configuration, OpenAIApi } from "https://esm.sh/openai@3.2.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Configuration OpenAI avec la clé API
const configuration = new Configuration({
  apiKey: Deno.env.get("OPENAI_API_KEY"),
});
const openai = new OpenAIApi(configuration);

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

    console.log("Appel à l'API OpenAI...");

    // Appel à l'API OpenAI avec le modèle gpt-3.5-turbo
    const completion = await openai.createChatCompletion({
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
    });

    // Extraire le texte du résumé de la réponse
    const summaryText = completion.data.choices[0]?.message?.content || "";

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
