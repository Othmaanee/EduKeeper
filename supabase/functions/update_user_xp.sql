
-- Fonction de mise à jour sécurisée des XP utilisateur
CREATE OR REPLACE FUNCTION public.update_user_xp(
  user_id UUID,
  xp_to_add INTEGER,
  action_type TEXT,
  action_description TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  new_xp INTEGER;
  old_level INTEGER;
  new_level INTEGER;
BEGIN
  -- Vérification du paramètre user_id
  IF user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'ID utilisateur manquant');
  END IF;
  
  -- Vérification du paramètre xp_to_add
  IF xp_to_add IS NULL OR xp_to_add <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Montant XP invalide');
  END IF;
  
  -- Récupérer le niveau actuel
  SELECT level INTO old_level FROM public.users WHERE id = user_id;
  
  -- Mettre à jour les XP de l'utilisateur
  UPDATE public.users
  SET xp = xp + xp_to_add
  WHERE id = user_id
  RETURNING xp INTO new_xp;
  
  -- Récupérer le nouveau niveau après trigger
  SELECT level INTO new_level FROM public.users WHERE id = user_id;
  
  -- Enregistrer l'historique de l'action
  INSERT INTO public.history (
    user_id, 
    action_type, 
    document_name, 
    xp_gained
  ) VALUES (
    user_id,
    action_type,
    action_description,
    xp_to_add
  );
  
  -- Construire et retourner la réponse
  RETURN jsonb_build_object(
    'success', true,
    'xp_added', xp_to_add,
    'new_xp', new_xp,
    'old_level', old_level,
    'new_level', new_level,
    'level_up', new_level > old_level
  );
END;
$$;

-- Ajouter les permissions nécessaires pour les utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION public.update_user_xp TO authenticated;

-- S'assurer que la policy pour la table users existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'users' AND policyname = 'Users can update their own data' AND cmd = 'UPDATE'
    ) THEN
        CREATE POLICY "Users can update their own data" 
        ON public.users 
        FOR UPDATE 
        USING (auth.uid() = id);
    END IF;
END
$$;
