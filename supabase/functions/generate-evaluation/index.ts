
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Vérifier si la méthode est OPTIONS (requête CORS preflight)
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Récupérer et valider la clé API OpenAI
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('Erreur: Clé API OpenAI manquante');
      return new Response(
        JSON.stringify({ error: 'Configuration de la clé API OpenAI manquante' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Extraire les données de la requête
    let requestData;
    try {
      requestData = await req.json();
    } catch (parseError) {
      console.error("Erreur de parsing JSON de la requête:", parseError.message);
      return new Response(
        JSON.stringify({ error: "Format de requête invalide" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { sujet, classe, specialite, difficulte } = requestData;

    if (!sujet || !classe || !difficulte) {
      return new Response(
        JSON.stringify({ error: 'Paramètres manquants : sujet, classe et difficulté sont requis' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Génération d'un contrôle - Sujet: ${sujet}, Classe: ${classe}, Difficulté: ${difficulte}`);

    // Adapter le prompt en fonction du niveau scolaire
    let formatControle = "";
    let notationGuidelines = "";
    
    if (["6e", "5e", "4e", "3e"].includes(classe)) {
      // Format pour le collège
      formatControle = "Format adapté aux collégiens avec consignes clairement détaillées. Utiliser un langage simple et direct. Inclure une variété d'exercices dont au moins un QCM.";
      notationGuidelines = "Barème sur 20 points clairement indiqué pour chaque exercice. Privilégier des questions à points progressifs.";
    } else if (["2nde", "1ere", "Terminale"].includes(classe)) {
      // Format pour le lycée
      formatControle = "Format formel de contrôle de lycée avec une partie théorique et une partie pratique. Inclure des questions de difficulté progressive.";
      notationGuidelines = "Barème détaillé sur 20 points avec indication des points par question et sous-question.";
    } else {
      // Format supérieur ou autre
      formatControle = "Format académique avec problématiques complexes et questions ouvertes. Privilégier l'analyse critique et la résolution de problèmes.";
      notationGuidelines = "Barème sur 20 points avec évaluation détaillée des compétences attendues.";
    }

    // Construction du prompt pour OpenAI
    let prompt = `Tu es un professeur expérimenté. Crée un contrôle complet et structuré pour un élève de niveau ${classe}, sur le sujet "${sujet}".

Format du contrôle:
- Titre clair et numéro du contrôle
- Introduction avec contexte et consignes générales
- ${formatControle}
- 3 à 5 exercices distincts organisés par difficulté progressive
- Chaque exercice doit comporter plusieurs questions cohérentes
- ${notationGuidelines}
- Durée recommandée: 1 à 2 heures selon le niveau

Le contrôle doit être adapté au niveau de difficulté ${difficulte}.

IMPORTANT:
1. Il DOIT s'agir d'un contrôle COMPLET et STRUCTURÉ, pas de questions isolées
2. Respecter scrupuleusement le niveau ${classe}
3. Fournir une présentation professionnelle type Éducation Nationale
4. Inclure le corrigé détaillé après le contrôle`;
    
    // Ajouter la spécialité si elle est fournie et n'est pas "aucune"
    if (specialite && specialite.trim() !== '' && specialite !== 'aucune') {
      prompt += `, spécialité "${specialite}"`;
    }

    // Ajout de logs pour débugger
    console.log('Envoi de la requête à OpenAI avec le prompt amélioré');
    console.log('Modèle utilisé:', "gpt-4o-mini");
    
    // Appel à l'API OpenAI avec un modèle plus performant
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",  // Utilisation d'un modèle plus performant
        messages: [
          {
            role: "system",
            content: "Tu es un professeur expérimenté de l'Éducation Nationale qui crée des contrôles d'évaluation professionnels, complets et structurés."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
      }),
    });

    // Vérifier si la réponse est ok
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erreur OpenAI (${response.status}):`, errorText);
      return new Response(
        JSON.stringify({ 
          error: `Erreur lors de la génération du contrôle (${response.status})`,
          details: errorText
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Traiter la réponse
    let data;
    try {
      data = await response.json();
      console.log('Réponse OpenAI parsée correctement:', JSON.stringify(data).substring(0, 100) + "...");
    } catch (jsonError) {
      console.error("Erreur lors du parsing de la réponse OpenAI:", jsonError);
      const rawResponse = await response.text();
      console.error("Réponse brute (premiers 200 caractères):", rawResponse.substring(0, 200));
      return new Response(
        JSON.stringify({ error: "Impossible de parser la réponse de l'API" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    const evaluation = data.choices[0]?.message?.content || "Désolé, impossible de générer le contrôle.";
    
    console.log('Réponse reçue d\'OpenAI, longueur du contenu:', evaluation.length);
    console.log('Premiers caractères du contenu:', evaluation.substring(0, 100) + "...");

    // Retourner les résultats dans un format JSON valide
    return new Response(
      JSON.stringify({ 
        evaluation,
        sujet,
        classe,
        difficulte 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Erreur dans la fonction generate-evaluation:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erreur inconnue lors de la génération du contrôle' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
