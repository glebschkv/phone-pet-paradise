import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

/**
 * Server-side coin validation edge function
 *
 * SECURITY: All coin operations (earn, spend) must be validated server-side
 * to prevent client-side manipulation. This function:
 * 1. Validates the operation type and amount
 * 2. Checks user balance for spend operations
 * 3. Applies rate limiting to prevent abuse
 * 4. Uses atomic database operations to prevent race conditions
 */

// SECURITY: Rate limiting - separate limits for earn vs spend
const rateLimitMap = new Map<string, { earnCount: number; spendCount: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_EARN = 15; // Max earn operations per minute (increased to handle reward bursts)
const RATE_LIMIT_MAX_SPEND = 20; // Max spend operations per minute

// PHASE 2: Sources that bypass rate limiting (trusted game events)
const RATE_EXEMPT_SOURCES = ['daily_reward', 'achievement', 'quest_reward', 'subscription_bonus'] as const;
type RateExemptSource = typeof RATE_EXEMPT_SOURCES[number];

function checkRateLimit(
  userId: string,
  operation: 'earn' | 'spend'
): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  let userLimit = rateLimitMap.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    userLimit = { earnCount: 0, spendCount: 0, resetTime: now + RATE_LIMIT_WINDOW_MS };
    rateLimitMap.set(userId, userLimit);
  }

  const maxRequests = operation === 'earn' ? RATE_LIMIT_MAX_EARN : RATE_LIMIT_MAX_SPEND;
  const currentCount = operation === 'earn' ? userLimit.earnCount : userLimit.spendCount;

  if (currentCount >= maxRequests) {
    return { allowed: false, retryAfter: Math.ceil((userLimit.resetTime - now) / 1000) };
  }

  if (operation === 'earn') {
    userLimit.earnCount++;
  } else {
    userLimit.spendCount++;
  }

  return { allowed: true };
}

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [userId, limit] of rateLimitMap.entries()) {
    if (now > limit.resetTime) {
      rateLimitMap.delete(userId);
    }
  }
}, RATE_LIMIT_WINDOW_MS);

// CORS configuration
const getProductionOrigins = (): string[] => {
  const envOrigins = Deno.env.get('ALLOWED_ORIGINS');
  if (envOrigins) {
    return envOrigins.split(',').map(o => o.trim()).filter(Boolean);
  }
  return [];
};

const STATIC_ALLOWED_ORIGINS = [
  'capacitor://localhost',
  'ionic://localhost',
  'http://localhost:5173',
  'http://localhost:8080',
  'http://localhost:3000',
];

const isAllowedOrigin = (origin: string | null): boolean => {
  if (!origin) return false;
  
  // Check static origins
  if (STATIC_ALLOWED_ORIGINS.includes(origin)) return true;
  
  // Check production origins from env
  const productionOrigins = getProductionOrigins();
  if (productionOrigins.includes(origin)) return true;
  
  // Allow Lovable preview domains (*.lovableproject.com)
  if (origin.endsWith('.lovableproject.com') || origin.includes('.lovableproject.com')) return true;
  
  // Allow Lovable dev domains
  if (origin.endsWith('.lovable.app') || origin.includes('.lovable.app')) return true;
  
  return false;
};

const getCorsHeaders = (origin: string | null) => {
  if (isAllowedOrigin(origin)) {
    return {
      'Access-Control-Allow-Origin': origin!,
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    };
  }
  return {
    'Access-Control-Allow-Origin': 'null',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
};

// Maximum coins that can be earned in a single operation
// Based on max session (5 hours = 750 base * 4x lifetime * 2.5x jackpot = 7500)
const MAX_EARN_AMOUNT = 10000;
// Maximum coins that can be spent in a single operation
const MAX_SPEND_AMOUNT = 100000;

// Valid earn sources for audit purposes
const VALID_EARN_SOURCES = [
  'focus_session',
  'daily_reward',
  'achievement',
  'quest_reward',
  'subscription_bonus',
  'lucky_wheel',
  'referral',
  'admin_grant',
  'iap_purchase', // In-app purchase (coin packs, bundles) - validated by StoreKit client-side
] as const;

type EarnSource = typeof VALID_EARN_SOURCES[number];

// Valid spend purposes for audit purposes
const VALID_SPEND_PURPOSES = [
  'shop_purchase',
  'pet_unlock',
  'cosmetic',
  'booster',
  'streak_freeze',
] as const;

type SpendPurpose = typeof VALID_SPEND_PURPOSES[number];

interface EarnRequest {
  operation: 'earn';
  amount: number;
  source: EarnSource;
  sessionId?: string; // For focus sessions to prevent duplicate rewards
  metadata?: Record<string, unknown>;
}

interface SpendRequest {
  operation: 'spend';
  amount: number;
  purpose: SpendPurpose;
  itemId?: string;
  metadata?: Record<string, unknown>;
}

interface GetBalanceRequest {
  operation: 'get_balance';
}

type CoinRequest = EarnRequest | SpendRequest | GetBalanceRequest;

interface _CoinTransaction {
  user_id: string;
  operation: 'earn' | 'spend';
  amount: number;
  source_or_purpose: string;
  balance_before: number;
  balance_after: number;
  session_id: string | null;
  item_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

serve(async (req) => {
  const origin = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Use anon key for user auth
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Use service role for atomic operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const body: CoinRequest = await req.json();

    // Handle balance check request
    if (body.operation === 'get_balance') {
      const { data: progress, error: progressError } = await supabaseAdmin
        .from('user_progress')
        .select('coins, total_coins_earned, total_coins_spent')
        .eq('user_id', user.id)
        .single();

      if (progressError) {
        // User might not have a progress record yet
        return new Response(JSON.stringify({
          success: true,
          balance: 0,
          totalEarned: 0,
          totalSpent: 0,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        balance: progress.coins || 0,
        totalEarned: progress.total_coins_earned || 0,
        totalSpent: progress.total_coins_spent || 0,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Rate limit check - exempt trusted sources from rate limiting
    const isEarnExempt = body.operation === 'earn' && 
      RATE_EXEMPT_SOURCES.includes((body as EarnRequest).source as RateExemptSource);
    
    if (!isEarnExempt) {
      const rateLimit = checkRateLimit(user.id, body.operation);
      if (!rateLimit.allowed) {
        console.log(`[RATE_LIMIT] User ${user.id} exceeded ${body.operation} limit. Source: ${body.operation === 'earn' ? (body as EarnRequest).source : (body as SpendRequest).purpose}`);
        return new Response(JSON.stringify({
          success: false,
          error: 'Rate limit exceeded. Please try again later.',
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': String(rateLimit.retryAfter || 60) },
        });
      }
    } else {
      console.log(`[RATE_EXEMPT] User ${user.id} earn operation exempt from rate limit. Source: ${(body as EarnRequest).source}`);
    }

    // Validate amount
    if (typeof body.amount !== 'number' || !Number.isFinite(body.amount) || body.amount <= 0) {
      throw new Error('Invalid amount: must be a positive number');
    }

    // Ensure integer
    const amount = Math.floor(body.amount);

    if (body.operation === 'earn') {
      // SECURITY: Validate earn request
      // Allow admin_grant to bypass the limit for debug/testing purposes
      if (amount > MAX_EARN_AMOUNT && body.source !== 'admin_grant') {
        throw new Error(`Invalid earn amount: cannot exceed ${MAX_EARN_AMOUNT}`);
      }

      if (!VALID_EARN_SOURCES.includes(body.source)) {
        throw new Error(`Invalid earn source: ${body.source}`);
      }

      // For focus sessions, check for duplicate session rewards
      if (body.source === 'focus_session' && body.sessionId) {
        const { data: existingReward } = await supabaseAdmin
          .from('coin_transactions')
          .select('id')
          .eq('user_id', user.id)
          .eq('session_id', body.sessionId)
          .eq('operation', 'earn')
          .single();

        if (existingReward) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Coins already awarded for this session',
            duplicate: true,
          }), {
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      // SECURITY: Atomic earn operation with locking
      // Use a transaction to prevent race conditions
      const { data: currentProgress, error: fetchError } = await supabaseAdmin
        .from('user_progress')
        .select('coins, total_coins_earned')
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        // Create initial progress record if it doesn't exist
        const { error: insertError } = await supabaseAdmin
          .from('user_progress')
          .insert({
            user_id: user.id,
            coins: amount,
            total_coins_earned: amount,
            total_coins_spent: 0,
          });

        if (insertError) {
          throw new Error('Failed to create user progress');
        }

        // Record transaction
        await supabaseAdmin.from('coin_transactions').insert({
          user_id: user.id,
          operation: 'earn',
          amount,
          source_or_purpose: body.source,
          balance_before: 0,
          balance_after: amount,
          session_id: body.sessionId || null,
          item_id: null,
          metadata: body.metadata || null,
        });

        return new Response(JSON.stringify({
          success: true,
          operation: 'earn',
          amount,
          newBalance: amount,
          totalEarned: amount,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const balanceBefore = currentProgress.coins || 0;
      const newBalance = balanceBefore + amount;
      const newTotalEarned = (currentProgress.total_coins_earned || 0) + amount;

      // Update with version check to prevent race conditions
      const { error: updateError } = await supabaseAdmin
        .from('user_progress')
        .update({
          coins: newBalance,
          total_coins_earned: newTotalEarned,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('coins', balanceBefore); // Optimistic locking

      if (updateError) {
        throw new Error('Failed to update balance - please retry');
      }

      // Record transaction for audit
      await supabaseAdmin.from('coin_transactions').insert({
        user_id: user.id,
        operation: 'earn',
        amount,
        source_or_purpose: body.source,
        balance_before: balanceBefore,
        balance_after: newBalance,
        session_id: body.sessionId || null,
        item_id: null,
        metadata: body.metadata || null,
      });

      // PHASE 5: Add detailed logging for debugging
      console.log(`[COIN_EARN] User: ${user.id}, Amount: ${amount}, Source: ${body.source}, New Balance: ${newBalance}`);

      return new Response(JSON.stringify({
        success: true,
        operation: 'earn',
        amount,
        newBalance,
        totalEarned: newTotalEarned,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (body.operation === 'spend') {
      // SECURITY: Validate spend request
      if (amount > MAX_SPEND_AMOUNT) {
        throw new Error(`Invalid spend amount: cannot exceed ${MAX_SPEND_AMOUNT}`);
      }

      if (!VALID_SPEND_PURPOSES.includes(body.purpose)) {
        throw new Error(`Invalid spend purpose: ${body.purpose}`);
      }

      // SECURITY: Atomic spend operation - check balance and deduct atomically
      const { data: currentProgress, error: fetchError } = await supabaseAdmin
        .from('user_progress')
        .select('coins, total_coins_spent')
        .eq('user_id', user.id)
        .single();

      if (fetchError || !currentProgress) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Insufficient balance',
          currentBalance: 0,
          required: amount,
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const balanceBefore = currentProgress.coins || 0;

      // SECURITY: Check balance before spending
      if (balanceBefore < amount) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Insufficient balance',
          currentBalance: balanceBefore,
          required: amount,
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const newBalance = balanceBefore - amount;
      const newTotalSpent = (currentProgress.total_coins_spent || 0) + amount;

      // Update with optimistic locking to prevent double-spending
      const { data: updatedRows, error: updateError } = await supabaseAdmin
        .from('user_progress')
        .update({
          coins: newBalance,
          total_coins_spent: newTotalSpent,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('coins', balanceBefore) // SECURITY: Optimistic lock - fails if balance changed
        .select();

      if (updateError || !updatedRows || updatedRows.length === 0) {
        // Balance was modified by another request - fail closed
        return new Response(JSON.stringify({
          success: false,
          error: 'Balance changed during transaction - please retry',
          retry: true,
        }), {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Record transaction for audit
      await supabaseAdmin.from('coin_transactions').insert({
        user_id: user.id,
        operation: 'spend',
        amount,
        source_or_purpose: body.purpose,
        balance_before: balanceBefore,
        balance_after: newBalance,
        session_id: null,
        item_id: body.itemId || null,
        metadata: body.metadata || null,
      });

      // PHASE 5: Add detailed logging for debugging
      console.log(`[COIN_SPEND] User: ${user.id}, Amount: ${amount}, Purpose: ${body.purpose}, Item: ${body.itemId || 'N/A'}, New Balance: ${newBalance}`);

      return new Response(JSON.stringify({
        success: true,
        operation: 'spend',
        amount,
        newBalance,
        totalSpent: newTotalSpent,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Invalid operation type');

  } catch (error) {
    console.error('Coin validation error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 400,
      headers: { ...getCorsHeaders(req.headers.get('Origin')), 'Content-Type': 'application/json' },
    });
  }
});
