-- Create user_subscriptions table for storing validated IAP subscriptions
CREATE TABLE public.user_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  transaction_id TEXT NOT NULL UNIQUE,
  original_transaction_id TEXT,
  tier TEXT NOT NULL CHECK (tier IN ('premium', 'premium_plus')),
  period TEXT NOT NULL CHECK (period IN ('monthly', 'yearly', 'lifetime')),
  purchase_date TIMESTAMP WITH TIME ZONE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  environment TEXT NOT NULL DEFAULT 'production' CHECK (environment IN ('sandbox', 'production')),
  receipt_data TEXT,
  signed_transaction TEXT,
  validated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  revoked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_transaction_id ON public.user_subscriptions(transaction_id);
CREATE INDEX idx_user_subscriptions_is_active ON public.user_subscriptions(is_active) WHERE is_active = true;
CREATE INDEX idx_user_subscriptions_expires_at ON public.user_subscriptions(expires_at) WHERE expires_at IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_subscriptions
CREATE POLICY "Users can view their own subscriptions" ON public.user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Only allow service role to insert/update/delete (server-side validation only)
CREATE POLICY "Service role can manage subscriptions" ON public.user_subscriptions
  FOR ALL USING (auth.role() = 'service_role');

-- Create trigger for updated_at
CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to check if user has active subscription
CREATE OR REPLACE FUNCTION public.get_user_subscription_tier(p_user_id UUID)
RETURNS TABLE (
  tier TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_lifetime BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    us.tier,
    us.expires_at,
    (us.period = 'lifetime') as is_lifetime
  FROM public.user_subscriptions us
  WHERE us.user_id = p_user_id
    AND us.is_active = true
    AND (us.expires_at IS NULL OR us.expires_at > now())
    AND us.revoked_at IS NULL
  ORDER BY
    CASE us.tier WHEN 'premium_plus' THEN 1 ELSE 2 END,
    us.expires_at DESC NULLS FIRST
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to deactivate expired subscriptions (can be called by cron job)
CREATE OR REPLACE FUNCTION public.deactivate_expired_subscriptions()
RETURNS INTEGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
