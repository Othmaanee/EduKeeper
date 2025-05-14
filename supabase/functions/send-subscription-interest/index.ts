
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Interface pour la requête d'intérêt pour l'abonnement
interface SubscriptionInterestRequest {
  userId?: string;
  email?: string;
  name?: string;
  message: string;
}

serve(async (req) => {
  // Gérer les requêtes CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    // Récupérer les données de la requête
    const { userId, email, name, message } = await req.json() as SubscriptionInterestRequest;

    // Créer un client Supabase
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Si un userId est fourni, récupérer les informations de l'utilisateur
    let userInfo = { email: email || "non spécifié", name: name || "non spécifié" };
    
    if (userId) {
      const { data: userData, error: userError } = await supabaseClient
        .from("users")
        .select("email, prenom, nom")
        .eq("id", userId)
        .single();

      if (!userError && userData) {
        userInfo.email = userData.email;
        userInfo.name = `${userData.prenom || ""} ${userData.nom || ""}`.trim() || "non spécifié";
      }
    }

    // Créer un enregistrement dans la table subscribers (si elle existe)
    try {
      await supabaseClient.from("subscribers").insert({
        email: userInfo.email,
        user_id: userId,
        subscribed: false,
      });
    } catch (error) {
      console.log("Erreur lors de l'enregistrement dans la table subscribers:", error);
      // Continuer même en cas d'erreur car l'envoi d'email est plus important
    }

    // Préparer le message à envoyer
    const mailContent = `
Nouvel intérêt pour l'abonnement EduKeeper

Détails de l'utilisateur :
- Email: ${userInfo.email}
- Nom: ${userInfo.name}
- ID utilisateur: ${userId || "non connecté"}
- Message: ${message}

Envoyé le: ${new Date().toLocaleString("fr-FR")}
    `;

    // Envoyer un email à l'adresse spécifiée
    const mailOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: "edukeeper.appli@gmail.com",
        subject: "Nouvel intérêt pour l'abonnement EduKeeper",
        text: mailContent,
      }),
    };

    // Ici, on simulerait l'envoi d'email avec un service comme SendGrid ou Mailgun
    // Pour l'instant, on log simplement le contenu
    console.log("Email qui serait envoyé:", mailContent);

    return new Response(
      JSON.stringify({ success: true, message: "Intérêt pour l'abonnement enregistré" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erreur:", error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
