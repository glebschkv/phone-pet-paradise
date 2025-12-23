import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

// SECURITY: Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per minute per user

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

// Achievement definitions - keep in sync with frontend
const ACHIEVEMENT_DEFINITIONS = [
  {
    id: 'focus-beginner',
    title: 'First Steps',
    description: 'Complete your first 10 minutes of focus time',
    category: 'focus',
    tier: 'bronze',
    target: 10,
    checkType: 'total_focus_time',
    rewardXp: 50
  },
  {
    id: 'focus-warrior',
    title: 'Focus Warrior',
    description: 'Accumulate 10 hours of total focus time',
    category: 'focus',
    tier: 'silver',
    target: 600,
    checkType: 'total_focus_time',
    rewardXp: 200
  },
  {
    id: 'focus-master',
    title: 'Focus Master',
    description: 'Reach 100 hours of total focus time',
    category: 'focus',
    tier: 'gold',
    target: 6000,
    checkType: 'total_focus_time',
    rewardXp: 500
  },
  {
    id: 'marathon-master',
    title: 'Marathon Master',
    description: 'Complete a 4-hour focus session',
    category: 'focus',
    tier: 'gold',
    target: 240,
    checkType: 'single_session',
    rewardXp: 300
  },
  {
    id: 'perfect-week',
    title: 'Perfect Week',
    description: 'Complete focus sessions for 7 consecutive days',
    category: 'special',
    tier: 'gold',
    target: 7,
    checkType: 'streak',
    rewardXp: 300
  },
  {
    id: 'streak-master',
    title: 'Streak Master',
    description: 'Maintain a 30-day focus streak',
    category: 'special',
    tier: 'platinum',
    target: 30,
    checkType: 'streak',
    rewardXp: 600
  }
];

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
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': String(rateLimit.retryAfter || 60) },
      });
    }

    const body = await req.json();
    const { triggerType, sessionMinutes } = body;

    // SECURITY: Validate input parameters
    if (triggerType && typeof triggerType !== 'string') {
      throw new Error('Invalid trigger type');
    }

    // Validate sessionMinutes if provided (used for single_session achievements)
    let validatedSessionMinutes: number | undefined;
    if (sessionMinutes !== undefined) {
      if (typeof sessionMinutes !== 'number' || !Number.isFinite(sessionMinutes)) {
        throw new Error('Invalid session duration');
      }
      // Apply same max limit as calculate-xp (480 minutes = 8 hours)
      const MAX_SESSION_MINUTES = 480;
      if (sessionMinutes < 0 || sessionMinutes > MAX_SESSION_MINUTES) {
        throw new Error('Session duration out of range');
      }
      validatedSessionMinutes = Math.floor(sessionMinutes);
    }

    // SECURITY: Don't log user IDs or session details to prevent information disclosure

    // Get user's current achievements
    const { data: existingAchievements, error: achievementsError } = await supabase
      .from('achievements')
      .select('title')
      .eq('user_id', user.id);

    if (achievementsError) {
      throw new Error(`Failed to get achievements: ${achievementsError.message}`);
    }

    const unlockedTitles = new Set(existingAchievements?.map(a => a.title) || []);
    const newlyUnlocked = [];

    // Get current user stats for checking
    const { data: userProgress, error: progressError } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (progressError) {
      throw new Error(`Failed to get user progress: ${progressError.message}`);
    }

    // Get total focus time from sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from('focus_sessions')
      .select('duration_minutes')
      .eq('user_id', user.id);

    // Handle sessions error - but don't fail completely, use 0 as fallback
    // This allows achievements to still be checked even if sessions table has issues
    let totalFocusMinutes = 0;
    if (sessionsError) {
      console.error('Failed to get sessions for focus time calculation:', sessionsError);
      // Continue with 0 focus minutes - focus-time achievements won't unlock but others can
    } else if (sessions) {
      totalFocusMinutes = sessions.reduce((sum, session) => sum + session.duration_minutes, 0);
    }

    // Check each achievement
    for (const achievement of ACHIEVEMENT_DEFINITIONS) {
      if (unlockedTitles.has(achievement.title)) {
        continue; // Already unlocked
      }

      let shouldUnlock = false;

      switch (achievement.checkType) {
        case 'total_focus_time':
          shouldUnlock = totalFocusMinutes >= achievement.target;
          break;
        
        case 'single_session':
          if (triggerType === 'session_complete' && validatedSessionMinutes !== undefined) {
            shouldUnlock = validatedSessionMinutes >= achievement.target;
          }
          break;
        
        case 'streak':
          shouldUnlock = userProgress.current_streak >= achievement.target;
          break;
      }

      if (shouldUnlock) {
        try {
          const { error: insertError } = await supabase
            .from('achievements')
            .insert({
              user_id: user.id,
              title: achievement.title,
              description: achievement.description,
              achievement_type: achievement.category,
              reward_xp: achievement.rewardXp
            });

          if (insertError) {
            console.error(`Failed to insert achievement ${achievement.title}:`, insertError);
          } else {
            newlyUnlocked.push(achievement);
            // Achievement unlocked successfully
          }
        } catch (error) {
          console.error(`Error inserting achievement ${achievement.title}:`, error);
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      newlyUnlocked: newlyUnlocked.map(a => ({
        title: a.title,
        description: a.description,
        rewardXp: a.rewardXp
      })),
      totalChecked: ACHIEVEMENT_DEFINITIONS.length,
      totalFocusMinutes,
      currentStreak: userProgress.current_streak
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in process-achievements function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
