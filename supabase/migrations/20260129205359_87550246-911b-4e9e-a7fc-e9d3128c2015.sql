-- Fix search_path on all database functions for security and reliability

CREATE OR REPLACE FUNCTION public.deactivate_expired_subscriptions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.user_subscriptions
  SET is_active = false, updated_at = now()
  WHERE is_active = true
    AND expires_at IS NOT NULL
    AND expires_at < now();
 
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$function$;

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
    CASE us.tier WHEN 'premium_plus' THEN 1 ELSE 2 END,
    us.created_at DESC
  LIMIT 1;
END;
$function$;

CREATE OR REPLACE FUNCTION public.verify_coin_balance(p_user_id uuid)
RETURNS TABLE(stored_balance integer, calculated_balance integer, total_earned integer, total_spent integer, is_valid boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_stored_balance INTEGER;
    v_calculated_earned INTEGER;
    v_calculated_spent INTEGER;
BEGIN
    -- Get stored balance
    SELECT COALESCE(coins, 0) INTO v_stored_balance
    FROM public.user_progress
    WHERE user_id = p_user_id;

    -- Calculate from transactions
    SELECT
        COALESCE(SUM(CASE WHEN operation = 'earn' THEN amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN operation = 'spend' THEN amount ELSE 0 END), 0)
    INTO v_calculated_earned, v_calculated_spent
    FROM public.coin_transactions
    WHERE user_id = p_user_id;

    RETURN QUERY SELECT
        v_stored_balance,
        (v_calculated_earned - v_calculated_spent)::INTEGER,
        v_calculated_earned::INTEGER,
        v_calculated_spent::INTEGER,
        v_stored_balance = (v_calculated_earned - v_calculated_spent);
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;