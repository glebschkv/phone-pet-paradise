-- Add coin tracking columns to user_progress table
-- SECURITY: Server-side coin balance tracking to prevent client manipulation

ALTER TABLE user_progress
ADD COLUMN IF NOT EXISTS coins INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_coins_earned INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_coins_spent INTEGER DEFAULT 0;

-- Create coin transaction audit table for tracking all coin operations
-- SECURITY: Audit trail for detecting abuse and debugging issues
CREATE TABLE IF NOT EXISTS coin_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    operation VARCHAR(10) NOT NULL CHECK (operation IN ('earn', 'spend')),
    amount INTEGER NOT NULL CHECK (amount > 0),
    source_or_purpose VARCHAR(50) NOT NULL,
    balance_before INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    session_id VARCHAR(100), -- For focus session deduplication
    item_id VARCHAR(100), -- For purchase tracking
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_id ON coin_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_created_at ON coin_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_session_id ON coin_transactions(session_id) WHERE session_id IS NOT NULL;

-- RLS policies for coin_transactions
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;

-- Users can only read their own transactions
CREATE POLICY "Users can read own coin transactions"
    ON coin_transactions FOR SELECT
    USING (auth.uid() = user_id);

-- Only the service role can insert (via edge functions)
CREATE POLICY "Service role can insert coin transactions"
    ON coin_transactions FOR INSERT
    WITH CHECK (TRUE);

-- Prevent updates and deletes on audit table
-- (No UPDATE or DELETE policies = immutable audit trail)

-- Function to verify user's coin balance matches transaction history
-- SECURITY: Used for periodic audits to detect tampering
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
