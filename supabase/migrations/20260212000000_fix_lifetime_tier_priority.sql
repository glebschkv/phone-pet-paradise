-- Fix get_user_subscription_tier to prioritize lifetime > premium_plus > premium
-- Previously lifetime was not in the ordering and fell to ELSE (priority 2)

CREATE OR REPLACE FUNCTION public.get_user_subscription_tier(p_user_id uuid)
RETURNS TABLE(tier text, expires_at timestamp with time zone, is_lifetime boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    us.tier,
    us.expires_at,
    (us.period = 'lifetime') as is_lifetime
  FROM public.user_subscriptions us
  WHERE us.user_id = p_user_id
    AND us.is_active = true
    AND us.revoked_at IS NULL
    AND (us.expires_at IS NULL OR us.expires_at > now())
  ORDER BY
    CASE us.tier WHEN 'lifetime' THEN 0 WHEN 'premium_plus' THEN 1 WHEN 'premium' THEN 2 ELSE 3 END,
    us.created_at DESC
  LIMIT 1;
END;
$function$;
