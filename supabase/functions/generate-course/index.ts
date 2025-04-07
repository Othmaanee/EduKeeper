
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const groqApiKey = Deno.env.get('GROQ_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Fonction generate-course appelée");
    
    // Parse the request body safely
    let subject, courseLevel, courseStyle, courseDuration;
    try {
      const body = await req.json();
      subject = body.subject;
      courseLevel = body.courseLevel || "college";
      courseStyle = body.courseStyle || "detailed";
      courseDuration = body.courseDuration || "15min";
      
      console.log("Paramètres reçus:", { subject, courseLevel, courseStyle, courseDuration });
    } catch (parseError) {
      console.error('Erreur de parsing du JSON:', parseError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Format de requête invalide' 
        }),
        { 
          status: 400, 
          headers: corsHeaders
        }
      );
    }

    if (!subject) {
      console.error('Aucun sujet fourni');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Aucun sujet fourni' 
        }),
        { 
          status: 400, 
          headers: corsHeaders
        }
      );
    }

    console.log("Clé API Groq présente:", !!groqApiKey);
    if (!groqApiKey) {
      console.error('Clé API Groq manquante');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Clé API Groq manquante. Veuillez configurer la clé dans les secrets de la fonction Edge.' 
        }),
        { 
          status: 500, 
          headers: corsHeaders
        }
      );
    }

    // Traduire les valeurs des options en texte compréhensible
    const levelText = {
      "primary": "primaire (6-10 ans)",
      "college": "collège (11-15 ans)",
      "highschool": "lycée (16-18 ans)",
      "university": "études supérieures"
    }[courseLevel] || "collège";

    const styleText = {
      "summary": "résumé simple et concis",
      "detailed": "cours détaillé avec exemples",
      "flashcards": "fiches de révision avec points clés"
    }[courseStyle] || "cours détaillé";

    const durationText = {
      "5min": "environ 5 minutes de lecture",
      "15min": "environ 15 minutes de lecture",
      "30min": "environ 30 minutes de lecture"
    }[courseDuration] || "15 minutes";

    // Créer un prompt adapté aux options sélectionnées
    const systemPrompt = `Tu es un professeur expert qui génère un cours clair et pédagogique. 
Ton objectif est de créer un contenu éducatif de grande qualité, adapté au niveau demandé, avec le style spécifié, et pour la durée indiquée.`;

    const userPrompt = `Rédige un cours sur le sujet suivant: ${subject}
    
Niveau: ${levelText}
Style: ${styleText}
Durée de lecture: ${durationText}

Assure-toi que le contenu soit:
- Adapté au niveau demandé, avec un vocabulaire et des explications appropriés
- Structuré selon le style demandé (résumé, cours détaillé ou fiches)
- D'une longueur permettant une lecture en ${durationText}
- Pédagogique et engageant pour l'élève
`;

    try {
      console.log("Appel à l'API Groq...");
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3-70b-8192',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
        }),
      });

      // Handle API errors
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "Erreur de l'API Groq";
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error?.message || errorMessage;
        } catch (e) {
          // If we can't parse the error, use the raw text
          errorMessage = errorText || errorMessage;
        }
        
        console.error('Erreur API Groq:', errorMessage);
        
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Erreur API Groq: ${errorMessage}` 
          }),
          { 
            status: 500, 
            headers: corsHeaders
          }
        );
      }

      const data = await response.json();
      const courseContent = data.choices[0].message.content;
      console.log("Cours généré avec succès");

      return new Response(
        JSON.stringify({ 
          success: true, 
          content: courseContent 
        }),
        { headers: corsHeaders }
      );
    } catch (groqError) {
      console.error('Erreur lors de l\'appel à l\'API Groq:', groqError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: groqError.message || 'Erreur lors de la génération du cours' 
        }),
        { 
          status: 500, 
          headers: corsHeaders
        }
      );
    }
  } catch (error) {
    console.error('Erreur générale dans la fonction generate-course:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Une erreur inconnue est survenue' 
      }),
      { 
        status: 500, 
        headers: corsHeaders
      }
    );
  }
});
