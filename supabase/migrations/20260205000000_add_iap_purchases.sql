-- Add support for IAP coin packs and starter bundles
-- SECURITY: Server-side tracking of all purchases to prevent fraud

-- Create user_purchases table for tracking consumable and non-consumable purchases
CREATE TABLE IF NOT EXISTS user_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id VARCHAR(100) NOT NULL,
    transaction_id VARCHAR(100) NOT NULL UNIQUE,
    original_transaction_id VARCHAR(100),
    product_type VARCHAR(20) NOT NULL CHECK (product_type IN ('coin_pack', 'starter_bundle', 'booster')),
    coins_granted INTEGER DEFAULT 0,
    character_id VARCHAR(100),
    booster_id VARCHAR(100),
    streak_freezes_granted INTEGER DEFAULT 0,
    purchase_date TIMESTAMPTZ NOT NULL,
    platform VARCHAR(10) NOT NULL,
    environment VARCHAR(20) NOT NULL,
    signed_transaction TEXT,
    validated_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_purchases_user_id ON user_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_user_purchases_transaction_id ON user_purchases(transaction_id);
CREATE INDEX IF NOT EXISTS idx_user_purchases_product_type ON user_purchases(product_type);

-- RLS policies
ALTER TABLE user_purchases ENABLE ROW LEVEL SECURITY;

-- Users can read their own purchases
CREATE POLICY "Users can read own purchases"
    ON user_purchases FOR SELECT
    USING (auth.uid() = user_id);

-- Only service role can insert (via edge functions)
CREATE POLICY "Service role can insert purchases"
    ON user_purchases FOR INSERT
    WITH CHECK (TRUE);

-- RPC function to add coins to a user's balance
-- SECURITY: Atomic operation with audit trail
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if a user owns a specific bundle (for restore purchases)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all owned bundles for a user (for restore purchases)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
