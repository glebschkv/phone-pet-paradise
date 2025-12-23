import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

// SECURITY: Simple in-memory rate limiting
// Note: In production with multiple instances, use Redis or similar
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per minute per user

function checkRateLimit(userId: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    // Reset or create new rate limit entry
    rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }

  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfter = Math.ceil((userLimit.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }

  userLimit.count++;
  return { allowed: true };
}

// Clean up old entries periodically
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

// XP calculation logic - keep consistent with frontend
const XP_REWARDS = {
  30: 10,   // 30 minutes = 10 XP
  60: 25,   // 1 hour = 25 XP
  120: 60,  // 2 hours = 60 XP
  180: 100, // 3 hours = 100 XP
  240: 150, // 4 hours = 150 XP
  300: 210, // 5 hours = 210 XP
};

const MAX_LEVEL = 50;

const calculateLevelRequirement = (level: number): number => {
  if (level <= 5) {
    const requirements = [0, 25, 50, 75, 125];
    return requirements[level - 1] || 0;
  } else {
    let totalXP = 125; // XP for level 5
    let increment = 100; // Starting increment for level 6
    
    for (let i = 6; i <= level; i++) {
      totalXP += increment;
      increment += 50; // Increase by 50 each level
    }
    return totalXP;
  }
};

const calculateLevel = (totalXP: number): number => {
  let level = 1;
  while (level < MAX_LEVEL && totalXP >= calculateLevelRequirement(level + 1)) {
    level++;
  }
  return level;
};

const calculateXPFromDuration = (minutes: number): number => {
  const sortedDurations = Object.keys(XP_REWARDS)
    .map(Number)
    .sort((a, b) => b - a); // Sort descending

  for (const duration of sortedDurations) {
    if (minutes >= duration) {
      return XP_REWARDS[duration as keyof typeof XP_REWARDS];
    }
  }
  
  return 0; // No XP for sessions less than 30 minutes
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

    // Create supabase client
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

    // SECURITY: Check rate limit
    const rateLimit = checkRateLimit(user.id);
    if (!rateLimit.allowed) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Rate limit exceeded. Please try again later.',
      }), {
        status: 429,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Retry-After': String(rateLimit.retryAfter || 60),
        },
      });
    }

    const body = await req.json();
    const { sessionMinutes } = body;

    // SECURITY: Comprehensive input validation
    // Validate type
    if (typeof sessionMinutes !== 'number' || !Number.isFinite(sessionMinutes)) {
      throw new Error('Invalid session duration: must be a valid number');
    }

    // Validate minimum duration
    if (sessionMinutes < 1) {
      throw new Error('Invalid session duration: must be at least 1 minute');
    }

    // SECURITY: Validate maximum duration (8 hours = 480 minutes is a reasonable max for a single session)
    const MAX_SESSION_MINUTES = 480;
    if (sessionMinutes > MAX_SESSION_MINUTES) {
      throw new Error(`Invalid session duration: cannot exceed ${MAX_SESSION_MINUTES} minutes`);
    }

    // Ensure it's an integer (no fractional minutes)
    const validatedMinutes = Math.floor(sessionMinutes);

    // Calculate XP using validated minutes
    const xpGained = calculateXPFromDuration(validatedMinutes);
    
    // Get current user progress
    const { data: currentProgress, error: progressError } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (progressError) {
      throw new Error(`Failed to get user progress: ${progressError.message}`);
    }

    const oldLevel = currentProgress.current_level;
    const newTotalXP = currentProgress.total_xp + xpGained;
    const newLevel = calculateLevel(newTotalXP);
    const leveledUp = newLevel > oldLevel;

    // Calculate XP progress for new level
    const currentLevelXP = calculateLevelRequirement(newLevel);
    const nextLevelXP = newLevel >= MAX_LEVEL 
      ? calculateLevelRequirement(newLevel) 
      : calculateLevelRequirement(newLevel + 1);
    const xpToNextLevel = newLevel >= MAX_LEVEL ? 0 : nextLevelXP - newTotalXP;

    // Update user progress in a transaction
    const { data: updatedProgress, error: updateError } = await supabase
      .from('user_progress')
      .update({
        total_xp: newTotalXP,
        current_level: newLevel,
        total_sessions: currentProgress.total_sessions + 1,
        last_session_date: new Date().toISOString().split('T')[0]
      })
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update progress: ${updateError.message}`);
    }

    // Record the focus session using validated minutes
    const { error: sessionError } = await supabase
      .from('focus_sessions')
      .insert({
        user_id: user.id,
        duration_minutes: validatedMinutes,
        xp_earned: xpGained,
        session_type: 'focus'
      });

    if (sessionError) {
      console.error('Failed to record session:', sessionError);
      // Don't throw here, the XP calculation was successful
    }

    // XP calculation completed successfully

    return new Response(JSON.stringify({
      success: true,
      xpGained,
      oldLevel,
      newLevel,
      leveledUp,
      totalXP: newTotalXP,
      xpToNextLevel,
      currentLevelXP,
      updatedProgress
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in calculate-xp function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
