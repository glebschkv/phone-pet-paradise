-- Backfill user_settings for existing users who don't have them
INSERT INTO public.user_settings (user_id)
SELECT p.user_id 
FROM public.profiles p
LEFT JOIN public.user_settings s ON p.user_id = s.user_id
WHERE s.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;