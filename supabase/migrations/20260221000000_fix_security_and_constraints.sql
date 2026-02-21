-- Fix security vulnerabilities and missing constraints
-- Issues addressed:
--   #1: user_subscriptions.tier CHECK constraint missing 'lifetime'
--   #2: coin_transactions INSERT policy too permissive (WITH CHECK (TRUE))
--   #3: user_purchases INSERT policy too permissive (WITH CHECK (TRUE))
--   #9: add_user_coins, check_bundle_ownership, get_owned_bundles missing search_path

-- ============================================================================
-- #1: Add 'lifetime' to user_subscriptions tier CHECK constraint
-- The validate-receipt edge function inserts tier='lifetime' for lifetime
-- purchases, but the CHECK constraint only allows 'premium' and 'premium_plus'.
-- This causes lifetime purchases to silently fail with a constraint violation.
-- ============================================================================

ALTER TABLE public.user_subscriptions
  DROP CONSTRAINT IF EXISTS user_subscriptions_tier_check;

ALTER TABLE public.user_subscriptions
  ADD CONSTRAINT user_subscriptions_tier_check
  CHECK (tier IN ('premium', 'premium_plus', 'lifetime'));

-- ============================================================================
-- #2: Remove overly permissive coin_transactions INSERT policy
-- The current INSERT policy is WITH CHECK (TRUE), which allows any
-- authenticated user to insert arbitrary coin transaction records directly
-- via the Supabase client, bypassing the validate-coins edge function.
-- Only the service role (used by edge functions) should be able to insert.
-- ============================================================================

DROP POLICY IF EXISTS "Service role can insert coin transactions" ON public.coin_transactions;

-- No replacement INSERT policy needed - service role bypasses RLS entirely.
-- This means only edge functions (which use service role) can insert records.

-- ============================================================================
-- #3: Remove overly permissive user_purchases INSERT policy
-- Same issue as #2 - WITH CHECK (TRUE) allows any authenticated user to
-- insert fake purchase records directly.
-- ============================================================================

DROP POLICY IF EXISTS "Service role can insert purchases" ON public.user_purchases;

-- No replacement INSERT policy needed - service role bypasses RLS entirely.

-- ============================================================================
-- #9: Add SET search_path = public to IAP RPC functions
-- The 20260205000000 migration created these functions without search_path,
-- which is a PostgreSQL security concern (search_path hijacking).
-- ============================================================================

CREATE OR REPLACE FUNCTION add_user_coins(
    p_user_id UUID,
    p_amount INTEGER,
    p_source VARCHAR(50),
    p_reference_id VARCHAR(100) DEFAULT NULL
)
RETURNS TABLE (
    success BOOLEAN,
    new_balance INTEGER,
    error_message TEXT
) AS $$
DECLARE
    v_current_balance INTEGER;
    v_new_balance INTEGER;
BEGIN
    -- Validate input
    IF p_amount <= 0 THEN
        RETURN QUERY SELECT FALSE, 0, 'Amount must be positive'::TEXT;
        RETURN;
    END IF;

    -- Get or create user progress record and lock it for update
    INSERT INTO user_progress (user_id, coins, total_coins_earned)
    VALUES (p_user_id, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;

    SELECT coins INTO v_current_balance
    FROM user_progress
    WHERE user_id = p_user_id
    FOR UPDATE;

    v_new_balance := COALESCE(v_current_balance, 0) + p_amount;

    -- Update balance
    UPDATE user_progress
    SET
        coins = v_new_balance,
        total_coins_earned = total_coins_earned + p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- Record transaction for audit trail
    INSERT INTO coin_transactions (
        user_id,
        operation,
        amount,
        source_or_purpose,
        balance_before,
        balance_after,
        item_id,
        metadata
    ) VALUES (
        p_user_id,
        'earn',
        p_amount,
        p_source,
        COALESCE(v_current_balance, 0),
        v_new_balance,
        p_reference_id,
        jsonb_build_object('source', p_source, 'reference_id', p_reference_id)
    );

    RETURN QUERY SELECT TRUE, v_new_balance, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION check_bundle_ownership(
    p_user_id UUID,
    p_product_id VARCHAR(100)
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_purchases
        WHERE user_id = p_user_id
        AND product_id = p_product_id
        AND product_type = 'starter_bundle'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION get_owned_bundles(p_user_id UUID)
RETURNS TABLE (
    product_id VARCHAR(100),
    character_id VARCHAR(100),
    booster_id VARCHAR(100),
    streak_freezes_granted INTEGER,
    purchase_date TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        up.product_id,
        up.character_id,
        up.booster_id,
        up.streak_freezes_granted,
        up.purchase_date
    FROM user_purchases up
    WHERE up.user_id = p_user_id
    AND up.product_type = 'starter_bundle';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Also fix verify_coin_balance which was missing search_path in original migration
CREATE OR REPLACE FUNCTION verify_coin_balance(p_user_id UUID)
RETURNS TABLE (
    stored_balance INTEGER,
    calculated_balance INTEGER,
    total_earned INTEGER,
    total_spent INTEGER,
    is_valid BOOLEAN
) AS $$
DECLARE
    v_stored_balance INTEGER;
    v_calculated_earned INTEGER;
    v_calculated_spent INTEGER;
BEGIN
    -- Get stored balance
    SELECT COALESCE(coins, 0) INTO v_stored_balance
    FROM user_progress
    WHERE user_id = p_user_id;

    -- Calculate from transactions
    SELECT
        COALESCE(SUM(CASE WHEN operation = 'earn' THEN amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN operation = 'spend' THEN amount ELSE 0 END), 0)
    INTO v_calculated_earned, v_calculated_spent
    FROM coin_transactions
    WHERE user_id = p_user_id;

    RETURN QUERY SELECT
        v_stored_balance,
        (v_calculated_earned - v_calculated_spent)::INTEGER,
        v_calculated_earned::INTEGER,
        v_calculated_spent::INTEGER,
        v_stored_balance = (v_calculated_earned - v_calculated_spent);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
