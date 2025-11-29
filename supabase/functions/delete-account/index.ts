import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

// CORS configuration
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:8080',
  'capacitor://localhost',
  'ionic://localhost',
];

const getCorsHeaders = (origin: string | null) => {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
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

    console.log(`Starting account deletion for user ${user.id}`);

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

    console.log(`Account deletion complete for user ${user.id}`);

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
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
