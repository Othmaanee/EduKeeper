
-- Fonction RPC pour la mise à jour des XP utilisateur
CREATE OR REPLACE FUNCTION public.update_user_xp(user_id UUID, new_xp INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.users 
  SET xp = new_xp 
  WHERE id = user_id;
END;
$$;

-- Accorder les autorisations nécessaires
GRANT EXECUTE ON FUNCTION public.update_user_xp(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_xp(UUID, INTEGER) TO anon;
