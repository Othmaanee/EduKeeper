
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const groqApiKey = Deno.env.get('GROQ_API_KEY'); // En cas d'utilisation de Groq comme alternative

// En-têtes CORS pour s'assurer que la fonction peut être appelée depuis l'application web
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Gestion des requêtes CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Analyse du corps de la requête
    const { documentUrl, documentText, role } = await req.json();
    
    console.log(`Requête reçue: URL=${documentUrl}, Texte fourni=${!!documentText}, Rôle=${role}`);

    // Vérifier si nous avons directement du texte ou si nous devons le récupérer depuis l'URL
    let textToSummarize = documentText;
    
    // Si le texte n'est pas fourni mais l'URL oui, on essaie de récupérer le contenu
    if (!textToSummarize && documentUrl) {
      console.log(`Récupération du contenu depuis l'URL: ${documentUrl}`);
      try {
        const response = await fetch(documentUrl);
        if (!response.ok) {
          throw new Error(`Échec de récupération du document: ${response.status} ${response.statusText}`);
        }
        textToSummarize = await response.text();
      } catch (error) {
        console.error("Erreur lors de la récupération du document depuis l'URL:", error);
        return new Response(
          JSON.stringify({ success: false, error: "Impossible de récupérer le contenu du document" }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
    }

    // Validation des entrées
    if (!textToSummarize) {
      return new Response(
        JSON.stringify({ success: false, error: "Le texte du document est requis ou l'URL n'est pas valide" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Nettoyage et validation du rôle
    let cleanedRole = role;
    if (typeof cleanedRole === 'string') {
      // Supprimer les guillemets et les espaces en trop
      cleanedRole = cleanedRole.replace(/['"]+/g, '').trim();
    }
    console.log(`Rôle nettoyé: ${cleanedRole}`);

    // Sélectionner le prompt approprié selon le rôle de l'utilisateur
    let systemPrompt = "";
    if (cleanedRole === "user" || cleanedRole === "eleve") {
      systemPrompt = "Tu es un assistant qui résume les textes en français.";
    } else if (cleanedRole === "enseignant") {
      systemPrompt = "Rédige un résumé professionnel, clair et synthétique de ce texte, adapté pour un support pédagogique.";
    } else {
      console.error(`Rôle non valide: ${cleanedRole}`);
      return new Response(
        JSON.stringify({ success: false, error: "Rôle non valide" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Vérifier si nous avons des clés API disponibles
    if (!openAIApiKey && !groqApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "Aucune clé API disponible (OpenAI ou Groq)" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    let summary = "";
    let apiUsed = "";

    // Essayer OpenAI en premier si la clé est disponible
    if (openAIApiKey) {
      try {
        console.log(`Utilisation de l'API OpenAI avec le modèle: gpt-3.5-turbo`);
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

        // Vérifier si l'appel API a réussi
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

        // Analyser la réponse d'OpenAI
        const data = await response.json();
        summary = data.choices[0].message.content;
        apiUsed = "OpenAI";
        console.log("Résumé généré avec succès via OpenAI");

      } catch (error) {
        console.error("Erreur avec l'API OpenAI:", error);
        
        // Si OpenAI échoue et que nous avons une clé Groq, essayer avec Groq
        if (groqApiKey) {
          console.log("OpenAI a échoué, essai avec l'API Groq comme solution de secours...");
        } else {
          throw error; // Relancer l'erreur si pas de clé Groq
        }
      }
    }

    // Si le résumé n'est pas encore généré et la clé Groq est disponible, utiliser Groq
    if (!summary && groqApiKey) {
      try {
        console.log(`Utilisation de l'API Groq comme solution de secours avec modèle: llama3-8b-8192`);
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${groqApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama3-8b-8192', // Modèle de Groq
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `Résume ce texte : ${textToSummarize}` }
            ],
            temperature: 0.5,
            max_tokens: 1500,
          }),
        });

        // Vérifier si l'appel API a réussi
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

        // Analyser la réponse de Groq
        const data = await response.json();
        summary = data.choices[0].message.content;
        apiUsed = "Groq";
        console.log("Résumé généré avec succès via Groq");
        
      } catch (error) {
        console.error("Erreur avec l'API Groq:", error);
        throw error;
      }
    }

    // Retourner le résumé
    console.log(`Résumé généré avec succès via l'API ${apiUsed}`);
    return new Response(
      JSON.stringify({ success: true, summary, apiUsed }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Erreur dans la fonction summarize-document:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Une erreur est survenue lors de la génération du résumé" }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
