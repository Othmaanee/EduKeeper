
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { UserLevel } from '@/components/UserLevel';

const profileSchema = z.object({
  email: z.string().email().optional(),
  prenom: z.string().optional(),
  nom: z.string().min(1, "Le nom est requis"),
  classe: z.string().optional(),
  date_naissance: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export const ProfilePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creditsUsed, setCreditsUsed] = useState(0);
  const [creditsTotal] = useState(50);
  const [renewalDate, setRenewalDate] = useState<Date | null>(null);
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      email: '',
      prenom: '',
      nom: '',
      classe: '',
      date_naissance: '',
    },
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate('/login');
          return;
        }
        
        setUser(session.user);
        await fetchUserProfile(session.user.id);
      } catch (error) {
        console.error("Erreur lors de la vérification de l'authentification:", error);
        toast({
          title: "Erreur",
          description: "Impossible de récupérer vos informations. Veuillez vous reconnecter.",
          variant: "destructive",
        });
        navigate('/login');
      }
    };
    
    checkAuth();
  }, [navigate]);

  const fetchUserProfile = async (userId: string) => {
    try {
      setLoading(true);
      
      // Récupérer le profil utilisateur
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (profileError) throw profileError;
      
      setProfile(profileData);
      
      form.reset({
        email: profileData.email || '',
        prenom: profileData.prenom || '',
        nom: profileData.nom || '',
        classe: profileData.classe || '',
        date_naissance: profileData.date_naissance ? format(new Date(profileData.date_naissance), 'yyyy-MM-dd') : '',
      });
      
      // Calculer la date de renouvellement des crédits (1 mois après la création du compte)
      if (profileData.created_at) {
        const createdAt = new Date(profileData.created_at);
        const currentDate = new Date();
        
        // Trouver la date de renouvellement (même jour du mois suivant)
        let renewal = new Date(currentDate.getFullYear(), currentDate.getMonth(), createdAt.getDate());
        
        // Si nous avons déjà dépassé ce jour ce mois-ci, passer au mois suivant
        if (currentDate.getDate() > createdAt.getDate() || 
            (currentDate.getDate() === createdAt.getDate() && 
             currentDate.getHours() > createdAt.getHours())) {
          renewal.setMonth(renewal.getMonth() + 1);
        }
        
        setRenewalDate(renewal);
      }
      
      // Récupérer les statistiques d'utilisation des crédits IA pour le mois en cours
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      // Compter les actions liées à l'IA (résumés, exercices, contrôles)
      const { count } = await supabase
        .from('history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', startOfMonth.toISOString())
        .or('action_type.eq.generate_summary,action_type.eq.generate_exercises,action_type.eq.generate_control');
      
      setCreditsUsed(count || 0);
      
    } catch (error) {
      console.error("Erreur lors de la récupération du profil:", error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer votre profil. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values: ProfileFormValues) => {
    if (!user) return;
    
    try {
      setSaving(true);
      
      const updateData = {
        prenom: values.prenom,
        nom: values.nom,
        classe: values.classe,
        date_naissance: values.date_naissance,
      };
      
      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id);
      
      if (error) throw error;
      
      toast({
        description: "Votre profil a été mis à jour avec succès.",
      });
      
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour votre profil. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Profil utilisateur</h1>
        <Card className="border shadow-sm">
          <CardHeader>
            <Skeleton className="h-8 w-1/2 mb-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-5 w-1/4" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Profil utilisateur</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle>Informations personnelles</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} disabled className="bg-muted" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="prenom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prénom</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="nom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="classe"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Classe</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="date_naissance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date de naissance</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? "Enregistrement..." : "Enregistrer les modifications"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        <div className="space-y-6">
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle>Progression</CardTitle>
            </CardHeader>
            <CardContent>
              <UserLevel className="mb-6" />
            </CardContent>
          </Card>
          
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle>Crédits IA mensuels</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between mb-1 text-sm font-medium">
                  <span>Utilisés: {creditsUsed}/{creditsTotal}</span>
                  <span>{Math.round((creditsUsed / creditsTotal) * 100)}%</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary" 
                    style={{ width: `${Math.min(100, (creditsUsed / creditsTotal) * 100)}%` }}
                  />
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Vous avez utilisé {creditsUsed} crédits sur {creditsTotal} ce mois-ci
              </p>
              
              {renewalDate && (
                <p className="text-sm font-medium">
                  Renouvellement le {format(renewalDate, 'd MMMM yyyy', { locale: fr })}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
