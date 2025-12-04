import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

// CORS configuration - restrict to your app's domains in production
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:8080',
  'capacitor://localhost',
  'ionic://localhost',
  // Add your production domain here, e.g.:
  // 'https://your-app.com',
];

const getCorsHeaders = (origin: string | null) => {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
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

    const { triggerType, sessionMinutes } = await req.json();

    console.log(`Processing achievements for user ${user.id}, trigger: ${triggerType}, session: ${sessionMinutes}`);

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
          if (triggerType === 'session_complete' && sessionMinutes) {
            shouldUnlock = sessionMinutes >= achievement.target;
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
            console.log(`Unlocked achievement: ${achievement.title} for user ${user.id}`);
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
