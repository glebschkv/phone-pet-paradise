import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

// SECURITY: Simple in-memory rate limiting for account deletion
// Extra restrictive - only 3 attempts per 10 minutes
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 600000; // 10 minutes
const RATE_LIMIT_MAX_REQUESTS = 3; // 3 requests per 10 minutes per user

function checkRateLimit(userId: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }

  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, retryAfter: Math.ceil((userLimit.resetTime - now) / 1000) };
  }

  userLimit.count++;
  return { allowed: true };
}

// Clean up old rate limit entries periodically to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [userId, limit] of rateLimitMap.entries()) {
    if (now > limit.resetTime) {
      rateLimitMap.delete(userId);
    }
  }
}, RATE_LIMIT_WINDOW_MS);

// CORS configuration - environment-based for security
// SECURITY: Production origins loaded from environment, localhost only in development
const getProductionOrigins = (): string[] => {
  const envOrigins = Deno.env.get('ALLOWED_ORIGINS');
  if (envOrigins) {
    return envOrigins.split(',').map(o => o.trim()).filter(Boolean);
  }
  return [];
};

const ALLOWED_ORIGINS = [
  // Mobile app origins (always allowed)
  'capacitor://localhost',
  'ionic://localhost',
  // Production origins from environment
  ...getProductionOrigins(),
];

// Only allow localhost in development/test environments
const isDevelopment = Deno.env.get('ENVIRONMENT') !== 'production';
if (isDevelopment) {
  ALLOWED_ORIGINS.push('http://localhost:5173', 'http://localhost:8080');
}

const getCorsHeaders = (origin: string | null) => {
  // SECURITY: Strict origin validation - reject unknown origins
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
    return {
      'Access-Control-Allow-Origin': 'null',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    };
  }
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
};

serve(async (req) => {
  const origin = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create supabase client with user's auth token
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // SECURITY: Check rate limit (extra restrictive for account deletion)
    const rateLimit = checkRateLimit(user.id);
    if (!rateLimit.allowed) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Rate limit exceeded. Please try again later.',
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': String(rateLimit.retryAfter || 600) },
      });
    }

    // SECURITY: Don't log user IDs to prevent information disclosure

    // Create admin client for user deletion (requires service role key)
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseServiceKey) {
      throw new Error('Service role key not configured');
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Delete all user data (cascading deletes are set up in the schema,
    // but we explicitly delete to ensure everything is cleaned up)

    // Delete focus sessions
    const { error: sessionsError } = await supabaseAdmin
      .from('focus_sessions')
      .delete()
      .eq('user_id', user.id);

    if (sessionsError) {
      console.error('Error deleting focus sessions:', sessionsError);
    }

    // Delete achievements
    const { error: achievementsError } = await supabaseAdmin
      .from('achievements')
      .delete()
      .eq('user_id', user.id);

    if (achievementsError) {
      console.error('Error deleting achievements:', achievementsError);
    }

    // Delete quests
    const { error: questsError } = await supabaseAdmin
      .from('quests')
      .delete()
      .eq('user_id', user.id);

    if (questsError) {
      console.error('Error deleting quests:', questsError);
    }

    // Delete pets
    const { error: petsError } = await supabaseAdmin
      .from('pets')
      .delete()
      .eq('user_id', user.id);

    if (petsError) {
      console.error('Error deleting pets:', petsError);
    }

    // Delete coin transactions
    const { error: coinTxError } = await supabaseAdmin
      .from('coin_transactions')
      .delete()
      .eq('user_id', user.id);

    if (coinTxError) {
      console.error('Error deleting coin transactions:', coinTxError);
    }

    // Delete subscriptions
    const { error: subsError } = await supabaseAdmin
      .from('user_subscriptions')
      .delete()
      .eq('user_id', user.id);

    if (subsError) {
      console.error('Error deleting subscriptions:', subsError);
    }

    // Delete user progress
    const { error: progressError } = await supabaseAdmin
      .from('user_progress')
      .delete()
      .eq('user_id', user.id);

    if (progressError) {
      console.error('Error deleting user progress:', progressError);
    }

    // Delete user settings (if table exists)
    const { error: settingsError } = await supabaseAdmin
      .from('user_settings')
      .delete()
      .eq('user_id', user.id);

    if (settingsError && !settingsError.message.includes('does not exist')) {
      console.error('Error deleting user settings:', settingsError);
    }

    // Delete profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('user_id', user.id);

    if (profileError) {
      console.error('Error deleting profile:', profileError);
    }

    // Finally, delete the auth user using admin API
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (deleteUserError) {
      throw new Error(`Failed to delete user: ${deleteUserError.message}`);
    }

    // Account deletion completed successfully

    return new Response(JSON.stringify({
      success: true,
      message: 'Account deleted successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in delete-account function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
