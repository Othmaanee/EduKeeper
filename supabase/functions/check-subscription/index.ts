
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for enhanced debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Use the service role key to perform writes (upsert) in Supabase
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Vérifier si l'utilisateur a un compte client Stripe
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, checking for trial eligibility");
      
      // Vérifier si l'utilisateur a déjà un enregistrement dans subscribers
      const { data: existingSub } = await supabaseClient
        .from("subscribers")
        .select("*")
        .eq("email", user.email)
        .maybeSingle();
      
      // Si pas d'enregistrement, offrir une période d'essai
      if (!existingSub) {
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 14); // 14 jours d'essai
        
        await supabaseClient.from("subscribers").upsert({
          email: user.email,
          user_id: user.id,
          stripe_customer_id: null,
          subscribed: true, // En essai = abonné
          subscription_tier: "trial",
          trial_end: trialEnd.toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'email' });
        
        logStep("Created new trial subscription", { trialEnd: trialEnd.toISOString() });
        
        return new Response(JSON.stringify({ 
          subscribed: true, 
          subscription_tier: "trial",
          trial_end: trialEnd.toISOString()
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      } else {
        // Si l'utilisateur a un enregistrement mais pas de client Stripe
        const now = new Date();
        const trialEnd = existingSub.trial_end ? new Date(existingSub.trial_end) : null;
        
        if (trialEnd && now > trialEnd) {
          // Période d'essai terminée
          await supabaseClient.from("subscribers").upsert({
            email: user.email,
            user_id: user.id,
            stripe_customer_id: null,
            subscribed: false,
            subscription_tier: null,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'email' });
          
          logStep("Trial period ended", { userId: user.id });
          
          return new Response(JSON.stringify({ subscribed: false }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        } else if (trialEnd) {
          // Toujours en période d'essai
          logStep("User is in trial period", { 
            userId: user.id, 
            trialEnd: trialEnd.toISOString() 
          });
          
          return new Response(JSON.stringify({ 
            subscribed: true, 
            subscription_tier: "trial",
            trial_end: trialEnd.toISOString()
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        } else {
          // Pas de période d'essai définie, créer une nouvelle
          const trialEnd = new Date();
          trialEnd.setDate(trialEnd.getDate() + 14);
          
          await supabaseClient.from("subscribers").upsert({
            email: user.email,
            user_id: user.id,
            stripe_customer_id: null,
            subscribed: true,
            subscription_tier: "trial",
            trial_end: trialEnd.toISOString(),
            updated_at: new Date().toISOString(),
          }, { onConflict: 'email' });
          
          logStep("Created new trial subscription", { trialEnd: trialEnd.toISOString() });
          
          return new Response(JSON.stringify({ 
            subscribed: true, 
            subscription_tier: "trial",
            trial_end: trialEnd.toISOString()
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }
      }
    }

    // L'utilisateur a un compte client Stripe
    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Vérifier les abonnements actifs
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    
    const hasActiveSub = subscriptions.data.length > 0;
    let subscriptionEnd = null;

    if (hasActiveSub) {
      // Abonnement Stripe actif
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      logStep("Active subscription found", { subscriptionId: subscription.id, endDate: subscriptionEnd });
      
      await supabaseClient.from("subscribers").upsert({
        email: user.email,
        user_id: user.id,
        stripe_customer_id: customerId,
        subscribed: true,
        subscription_tier: "premium",
        subscription_end: subscriptionEnd,
        trial_end: null, // Réinitialiser la période d'essai
        updated_at: new Date().toISOString(),
      }, { onConflict: 'email' });

      return new Response(JSON.stringify({
        subscribed: true,
        subscription_tier: "premium",
        subscription_end: subscriptionEnd
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      logStep("No active subscription found, checking trial status");
      
      // Vérifier si l'utilisateur est encore en période d'essai
      const { data: existingSub } = await supabaseClient
        .from("subscribers")
        .select("*")
        .eq("email", user.email)
        .maybeSingle();
      
      if (existingSub && existingSub.trial_end) {
        const now = new Date();
        const trialEnd = new Date(existingSub.trial_end);
        
        if (now < trialEnd) {
          logStep("User is still in trial period", {
            userId: user.id,
            trialEnd: trialEnd.toISOString()
          });
          
          return new Response(JSON.stringify({
            subscribed: true,
            subscription_tier: "trial",
            trial_end: existingSub.trial_end
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }
      }
      
      // Pas d'abonnement actif et pas en période d'essai
      await supabaseClient.from("subscribers").upsert({
        email: user.email,
        user_id: user.id,
        stripe_customer_id: customerId,
        subscribed: false,
        subscription_tier: null,
        subscription_end: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'email' });
      
      logStep("User has no active subscription and is not in trial period");
      
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
