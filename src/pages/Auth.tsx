import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ArrowRight, Loader2, Eye, EyeOff, CheckCircle2, Circle, AlertTriangle } from 'lucide-react';
import { PixelIcon } from '@/components/ui/PixelIcon';
import { getAppBaseUrl, isValidEmail, validatePassword, sanitizeErrorMessage } from '@/lib/apiUtils';
import { PageErrorBoundary } from '@/components/PageErrorBoundary';
import { checkRateLimit, recordRateLimitAttempt, clearRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/security';
import { Capacitor } from '@capacitor/core';

const AUTH_BG = 'linear-gradient(180deg, hsl(260 30% 15%) 0%, hsl(280 25% 10%) 50%, hsl(220 25% 8%) 100%)';
const INPUT_CLASS = 'h-12 rounded-xl bg-[hsl(260_25%_18%/0.8)] border-[hsl(260_35%_35%)] text-white placeholder:text-purple-500 focus:border-[hsl(280_50%_55%)] focus:ring-[hsl(280_50%_55%)]';

// Apple logo SVG component
const AppleIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11" />
  </svg>
);

// SHA-256 hash a string and return hex-encoded result (needed for Apple Sign In nonce)
async function sha256(plain: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hash));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

type AuthMode = 'welcome' | 'magic-link' | 'email-password' | 'signup' | 'forgot-password' | 'reset-password';

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isLoading: authLoading, continueAsGuest, isGuestMode } = useAuth();
  const [mode, setMode] = useState<AuthMode>('welcome');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailSentTo, setEmailSentTo] = useState('');
  const formRef = useRef<HTMLDivElement>(null);

  // Check for reset-password mode from URL query params
  useEffect(() => {
    const urlMode = searchParams.get('mode');
    if (urlMode === 'reset-password') {
      setMode('reset-password');
    }
  }, [searchParams]);

  // Redirect to home if already authenticated with Supabase (not guest mode)
  // Guest users should be able to access auth page to create real accounts
  useEffect(() => {
    if (!authLoading && isAuthenticated && !isGuestMode) {
      navigate('/');
    }
  }, [authLoading, isAuthenticated, isGuestMode, navigate]);

  // Get the current URL for redirect (works for both web and Capacitor)
  const getRedirectUrl = () => {
    return getAppBaseUrl();
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isSupabaseConfigured) {
      toast.error('Authentication is not available. Please try again later.');
      return;
    }

    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    if (!isValidEmail(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    // SECURITY: Check rate limit before attempting auth
    const rateLimitKey = `auth:magic-link:${email.toLowerCase()}`;
    const rateLimit = checkRateLimit(rateLimitKey, RATE_LIMIT_CONFIGS.auth);
    if (rateLimit.isLimited) {
      toast.error(rateLimit.message);
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: getRedirectUrl(),
        },
      });

      if (error) {
        recordRateLimitAttempt(rateLimitKey, RATE_LIMIT_CONFIGS.auth, false);
        throw error;
      }

      // Clear rate limit on success
      clearRateLimit(rateLimitKey);
      setEmailSentTo(email);
      setEmailSent(true);
    } catch (error: unknown) {
      const message = sanitizeErrorMessage(error);
      if (message) toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isSupabaseConfigured) {
      toast.error('Authentication is not available. Please try again later.');
      return;
    }

    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!isValidEmail(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    // SECURITY: Check rate limit before attempting auth
    const rateLimitKey = `auth:password:${email.toLowerCase()}`;
    const rateLimit = checkRateLimit(rateLimitKey, RATE_LIMIT_CONFIGS.auth);
    if (rateLimit.isLimited) {
      toast.error(rateLimit.message);
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        recordRateLimitAttempt(rateLimitKey, RATE_LIMIT_CONFIGS.auth, false);
        throw error;
      }

      // Clear rate limit on successful login
      clearRateLimit(rateLimitKey);
      toast.success('Welcome back!');
      navigate('/');
    } catch (error: unknown) {
      const message = sanitizeErrorMessage(error);
      if (message) toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isSupabaseConfigured) {
      toast.error('Authentication is not available. Please try again later.');
      return;
    }

    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!isValidEmail(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      toast.error(passwordValidation.message);
      return;
    }

    // SECURITY: Check rate limit before attempting signup
    const rateLimitKey = `auth:signup:${email.toLowerCase()}`;
    const rateLimit = checkRateLimit(rateLimitKey, RATE_LIMIT_CONFIGS.auth);
    if (rateLimit.isLimited) {
      toast.error(rateLimit.message);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: getRedirectUrl(),
        },
      });

      if (error) {
        recordRateLimitAttempt(rateLimitKey, RATE_LIMIT_CONFIGS.auth, false);
        throw error;
      }

      // Check if user already exists (Supabase returns user but with empty identities)
      if (data?.user && (!data.user.identities || data.user.identities.length === 0)) {
        toast.error('An account with this email already exists', {
          description: 'Try signing in instead, or use "Forgot Password" to reset.',
        });
        setMode('email-password');
        setIsLoading(false);
        return;
      }

      // Clear rate limit on success — show inline confirmation
      clearRateLimit(rateLimitKey);
      setEmailSentTo(email);
      setEmailSent(true);
    } catch (error: unknown) {
      const message = sanitizeErrorMessage(error);
      if (message) toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isSupabaseConfigured) {
      toast.error('Authentication is not available. Please try again later.');
      return;
    }

    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    if (!isValidEmail(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    // SECURITY: Check rate limit for password reset (stricter limits)
    const rateLimitKey = `auth:reset:${email.toLowerCase()}`;
    const rateLimit = checkRateLimit(rateLimitKey, RATE_LIMIT_CONFIGS.passwordReset);
    if (rateLimit.isLimited) {
      toast.error(rateLimit.message);
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${getRedirectUrl()}/auth?mode=reset-password`,
      });

      if (error) {
        recordRateLimitAttempt(rateLimitKey, RATE_LIMIT_CONFIGS.passwordReset, false);
        throw error;
      }

      // Record attempt even on success to prevent email enumeration
      recordRateLimitAttempt(rateLimitKey, RATE_LIMIT_CONFIGS.passwordReset, false);
      toast.success('Password reset email sent!', {
        description: 'Check your email for a link to reset your password.',
      });
      setMode('welcome');
    } catch (error: unknown) {
      const message = sanitizeErrorMessage(error);
      if (message) toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isSupabaseConfigured) {
      toast.error('Authentication is not available. Please try again later.');
      return;
    }

    if (!password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      toast.error(passwordValidation.message);
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        throw error;
      }

      toast.success('Password updated successfully!', {
        description: 'You can now sign in with your new password.',
      });
      resetForm();
      // Clear the URL params and go to sign in
      navigate('/auth', { replace: true });
      setMode('email-password');
    } catch (error: unknown) {
      const message = sanitizeErrorMessage(error);
      if (message) toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestMode = () => {
    // Set guest mode flag and navigate
    continueAsGuest();
    navigate('/');
  };

  const handleAppleSignIn = async () => {
    if (!isSupabaseConfigured) {
      toast.error('Authentication is not available. Please try again later.');
      return;
    }

    setIsLoading(true);
    try {
      const isNativeIOS = Capacitor.getPlatform() === 'ios';

      if (isNativeIOS) {
        // Use native Sign in with Apple for iOS
        const { SignInWithApple } = await import('@capacitor-community/apple-sign-in');

        // Generate nonce: Apple needs SHA-256 hash, Supabase needs raw nonce
        const rawNonce = crypto.randomUUID();
        const hashedNonce = await sha256(rawNonce);

        const result = await SignInWithApple.authorize({
          clientId: 'co.nomoinc.nomo',
          redirectURI: 'https://nomoinc.co',
          scopes: 'email name',
          state: crypto.randomUUID(),
          nonce: hashedNonce,
        });

        // Pass the RAW nonce to Supabase — it will hash and verify against the token
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: result.response.identityToken,
          nonce: rawNonce,
        });

        if (error) throw error;

        toast.success('Welcome!');
        navigate('/');
      } else {
        // Use web OAuth redirect for non-iOS platforms
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'apple',
          options: {
            redirectTo: getRedirectUrl(),
          },
        });

        if (error) throw error;
      }
    } catch (error: unknown) {
      // Don't show error for user-initiated cancellations
      const errString = String(error);
      const isCancellation = errString.includes('cancel') || errString.includes('Cancel')
        || errString.includes('ASAuthorizationError') || errString.includes('1001');
      if (!isCancellation) {
        const message = sanitizeErrorMessage(error);
        if (message) toast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <PageErrorBoundary pageName="authentication page">
        <div className="min-h-screen flex items-center justify-center pt-safe pb-safe" style={{ background: AUTH_BG }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-purple-700 border-t-purple-400 mx-auto mb-4"></div>
            <p className="text-sm text-purple-400 animate-pulse">Loading...</p>
          </div>
        </div>
      </PageErrorBoundary>
    );
  }

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setEmailSent(false);
    setEmailSentTo('');
  };

  // Welcome screen with options
  if (mode === 'welcome') {
    return (
      <PageErrorBoundary pageName="authentication page">
        <div className="min-h-screen flex flex-col items-center justify-center px-6 pt-safe pb-safe relative" style={{ background: AUTH_BG }}>
          {/* Scanlines overlay */}
          <div className="absolute inset-0 retro-scanlines opacity-[0.03] pointer-events-none" />

          <div className="w-full max-w-sm space-y-8 relative z-[1]">
          {/* Logo/Title */}
          <div className="text-center space-y-2 relative">
            <div className="relative inline-block mb-3">
              <div
                className="absolute inset-0 rounded-full blur-xl scale-[2.5]"
                style={{ background: 'hsl(280 80% 50% / 0.15)' }}
              />
              <img
                src="/app-icon.png"
                alt="NoMo"
                className="relative w-20 h-20 mx-auto rounded-2xl"
                style={{
                  border: '3px solid hsl(280 50% 45%)',
                  boxShadow: '0 0 20px hsl(280 80% 40% / 0.3), 0 4px 12px rgba(0,0,0,0.4)',
                }}
              />
            </div>
            <h1
              className="text-3xl font-black uppercase tracking-tight text-white"
              style={{ textShadow: '0 0 20px hsl(280 80% 60% / 0.5), 0 0 40px hsl(280 80% 60% / 0.2)' }}
            >
              NoMo
            </h1>
            <p className="text-sm text-purple-300/70">Focus, grow, and collect pets!</p>
          </div>

          {/* Auth Options */}
          <div className="space-y-3">
            {/* Apple Sign-In - Primary option */}
            <button
              onClick={handleAppleSignIn}
              disabled={isLoading}
              className="w-full p-4 rounded-xl flex items-center gap-4 transition-all active:scale-[0.98] disabled:opacity-50"
              style={{
                background: 'linear-gradient(180deg, hsl(0 0% 12%) 0%, hsl(0 0% 5%) 100%)',
                border: '2px solid hsl(0 0% 22%)',
                boxShadow: '0 4px 0 hsl(0 0% 3%)',
              }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'hsl(0 0% 18%)', border: '2px solid hsl(0 0% 28%)' }}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                ) : (
                  <AppleIcon className="w-5 h-5 text-white" />
                )}
              </div>
              <div className="text-left flex-1">
                <p className="font-bold text-sm text-white">Continue with Apple</p>
                <p className="text-xs text-white/50">Fast & private sign in</p>
              </div>
            </button>

            <button
              onClick={() => { resetForm(); setMode('magic-link'); }}
              className="w-full p-4 rounded-xl flex items-center gap-4 transition-all active:scale-[0.98]"
              style={{
                background: 'linear-gradient(180deg, hsl(260 25% 22%) 0%, hsl(260 30% 16%) 100%)',
                border: '2px solid hsl(260 35% 35%)',
                boxShadow: '0 2px 0 hsl(260 30% 12%)',
              }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'hsl(260 30% 18%)', border: '2px solid hsl(260 40% 35%)' }}
              >
                <PixelIcon name="sparkles" size={24} />
              </div>
              <div className="text-left flex-1">
                <p className="font-bold text-sm text-white">Continue with Email</p>
                <p className="text-xs text-purple-300/60">Passwordless magic link</p>
              </div>
              <ArrowRight className="w-4 h-4 text-purple-400/50" />
            </button>

            <button
              onClick={() => { resetForm(); setMode('email-password'); }}
              className="w-full p-4 rounded-xl flex items-center gap-4 transition-all active:scale-[0.98]"
              style={{
                background: 'linear-gradient(180deg, hsl(260 25% 22%) 0%, hsl(260 30% 16%) 100%)',
                border: '2px solid hsl(260 35% 35%)',
                boxShadow: '0 2px 0 hsl(260 30% 12%)',
              }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'hsl(260 30% 18%)', border: '2px solid hsl(260 40% 35%)' }}
              >
                <PixelIcon name="sword" size={24} />
              </div>
              <div className="text-left flex-1">
                <p className="font-bold text-sm text-white">Sign in with Password</p>
                <p className="text-xs text-purple-300/60">Use email and password</p>
              </div>
              <ArrowRight className="w-4 h-4 text-purple-400/50" />
            </button>

            <div className="flex items-center gap-3 py-4">
              <div className="flex-1 h-px bg-purple-700/50" />
              <span className="text-xs text-purple-500 uppercase tracking-widest">or</span>
              <div className="flex-1 h-px bg-purple-700/50" />
            </div>

            <button
              onClick={handleGuestMode}
              className="w-full p-4 rounded-xl flex items-center gap-4 transition-all active:scale-[0.98] border-2 border-dashed border-purple-700/50 hover:border-purple-500/40"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'hsl(260 20% 18%)', border: '2px solid hsl(260 25% 30%)' }}
              >
                <PixelIcon name="ghost" size={24} />
              </div>
              <div className="text-left flex-1">
                <p className="font-bold text-sm text-purple-300">Continue as Guest</p>
                <p className="text-xs text-purple-400/60">No account needed</p>
              </div>
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-amber-900/20 border border-amber-600/30">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <p className="text-xs text-amber-400/80">
              Guest progress is saved on this device only and won't sync across devices
            </p>
          </div>
        </div>
        </div>
      </PageErrorBoundary>
    );
  }

  // Magic Link form
  if (mode === 'magic-link') {
    return (
      <PageErrorBoundary pageName="authentication page">
        <div className="min-h-screen flex flex-col items-center justify-center px-6 pt-safe pb-safe relative" style={{ background: AUTH_BG }}>
          <div className="absolute inset-0 retro-scanlines opacity-[0.03] pointer-events-none" />
          <div className="w-full max-w-sm space-y-6 relative z-[1]" ref={formRef}>
          <button
            onClick={() => { resetForm(); setMode('welcome'); }}
            className="min-h-[44px] min-w-[44px] flex items-center text-sm text-purple-400 hover:text-white transition-colors -ml-2 px-2"
          >
            ← Back
          </button>

          {emailSent ? (
            /* Inline email confirmation */
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center"
                style={{ background: 'hsl(120 30% 18%)', border: '2px solid hsl(120 50% 35%)' }}
              >
                <PixelIcon name="sparkles" size={36} />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-white">Check your email</h2>
                <p className="text-sm text-purple-300/70">
                  We sent a magic link to
                </p>
                <p className="text-sm font-semibold text-cyan-400">{emailSentTo}</p>
              </div>
              <p className="text-xs text-purple-400/70">
                Click the link in the email to sign in. It may take a minute to arrive.
              </p>
              <div className="pt-2 space-y-3">
                <button
                  className="retro-arcade-btn retro-arcade-btn-purple w-full py-3 text-sm"
                  onClick={() => { setEmailSent(false); }}
                >
                  Didn't receive it? Try again
                </button>
                <button
                  onClick={() => { resetForm(); setMode('welcome'); }}
                  className="text-sm text-purple-400 hover:text-white transition-colors"
                >
                  Back to sign in options
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center space-y-2">
                <div className="w-14 h-14 mx-auto mb-4 rounded-xl flex items-center justify-center"
                  style={{ background: 'hsl(260 30% 18%)', border: '2px solid hsl(260 40% 35%)' }}
                >
                  <PixelIcon name="sparkles" size={32} />
                </div>
                <h2 className="text-xl font-bold text-white">Magic Link</h2>
                <p className="text-sm text-purple-300/70">
                  We'll email you a link to sign in instantly
                </p>
              </div>

              <form onSubmit={handleMagicLink} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-purple-200">Email</label>
                  <Input
                    id="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={INPUT_CLASS}
                    disabled={isLoading}
                  />
                </div>

                <button
                  type="submit"
                  className="retro-arcade-btn retro-arcade-btn-green w-full py-3.5 text-sm font-bold tracking-wider disabled:opacity-60"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </span>
                  ) : (
                    'Send Magic Link'
                  )}
                </button>
              </form>

              <p className="text-center text-xs text-purple-300/70">
                Don't have an account?{' '}
                <button
                  onClick={() => { resetForm(); setMode('signup'); }}
                  className="text-cyan-400 hover:underline font-medium"
                >
                  Sign up
                </button>
              </p>
            </>
          )}
        </div>
        </div>
      </PageErrorBoundary>
    );
  }

  // Email + Password Sign In
  if (mode === 'email-password') {
    return (
      <PageErrorBoundary pageName="authentication page">
        <div className="min-h-screen flex flex-col items-center justify-center px-6 pt-safe pb-safe relative" style={{ background: AUTH_BG }}>
          <div className="absolute inset-0 retro-scanlines opacity-[0.03] pointer-events-none" />
          <div className="w-full max-w-sm space-y-6 relative z-[1]">
          <button
            onClick={() => { resetForm(); setMode('welcome'); }}
            className="min-h-[44px] min-w-[44px] flex items-center text-sm text-purple-400 hover:text-white transition-colors -ml-2 px-2"
          >
            ← Back
          </button>

          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto mb-4 rounded-xl flex items-center justify-center"
              style={{ background: 'hsl(260 30% 18%)', border: '2px solid hsl(260 40% 35%)' }}
            >
              <PixelIcon name="sword" size={32} />
            </div>
            <h2 className="text-xl font-bold text-white">Sign In</h2>
            <p className="text-sm text-purple-300/70">
              Welcome back! Enter your credentials
            </p>
          </div>

          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-purple-200">Email</label>
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={INPUT_CLASS}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-purple-200">Password</label>
                <button
                  type="button"
                  onClick={() => { setMode('forgot-password'); }}
                  className="text-xs text-cyan-400 hover:underline min-h-[44px] flex items-center"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${INPUT_CLASS} pr-12`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-purple-400 hover:text-white"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="retro-arcade-btn retro-arcade-btn-green w-full py-3.5 text-sm font-bold tracking-wider disabled:opacity-60"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="text-center text-xs text-purple-300/70">
            Don't have an account?{' '}
            <button
              onClick={() => { resetForm(); setMode('signup'); }}
              className="text-cyan-400 hover:underline font-medium"
            >
              Sign up
            </button>
          </p>
        </div>
        </div>
      </PageErrorBoundary>
    );
  }

  // Sign Up form
  if (mode === 'signup') {
    const pwChecks = password.length > 0 ? {
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
    } : null;

    return (
      <PageErrorBoundary pageName="authentication page">
        <div className="min-h-screen flex flex-col items-center justify-center px-6 pt-safe pb-safe relative" style={{ background: AUTH_BG }}>
          <div className="absolute inset-0 retro-scanlines opacity-[0.03] pointer-events-none" />
          <div className="w-full max-w-sm space-y-6 relative z-[1]" ref={formRef}>
          <button
            onClick={() => { resetForm(); setMode('welcome'); }}
            className="min-h-[44px] min-w-[44px] flex items-center text-sm text-purple-400 hover:text-white transition-colors -ml-2 px-2"
          >
            ← Back
          </button>

          {emailSent ? (
            /* Inline email verification confirmation */
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center"
                style={{ background: 'hsl(120 30% 18%)', border: '2px solid hsl(120 50% 35%)' }}
              >
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-white">Verify your email</h2>
                <p className="text-sm text-purple-300/70">
                  We sent a confirmation link to
                </p>
                <p className="text-sm font-semibold text-cyan-400">{emailSentTo}</p>
              </div>
              <p className="text-xs text-purple-400/70">
                Click the link in the email to activate your account. Check your spam folder if you don't see it.
              </p>
              <div className="pt-2 space-y-3">
                <button
                  className="retro-arcade-btn retro-arcade-btn-green w-full py-3 text-sm"
                  onClick={() => { resetForm(); setMode('email-password'); }}
                >
                  I've verified — Sign in
                </button>
                <button
                  onClick={() => { setEmailSent(false); }}
                  className="text-sm text-purple-400 hover:text-white transition-colors"
                >
                  Didn't receive it? Try again
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center space-y-2">
                <div className="relative inline-block mb-3">
                  <div
                    className="absolute inset-0 rounded-full blur-xl scale-[2]"
                    style={{ background: 'hsl(280 80% 50% / 0.1)' }}
                  />
                  <img
                    src="/app-icon.png"
                    alt="NoMo"
                    className="relative w-14 h-14 mx-auto rounded-xl"
                    style={{
                      border: '2px solid hsl(280 50% 45%)',
                      boxShadow: '0 0 12px hsl(280 80% 40% / 0.3)',
                    }}
                  />
                </div>
                <h2 className="text-xl font-bold text-white">Create Account</h2>
                <p className="text-sm text-purple-300/70">
                  Join NoMo and sync your progress
                </p>
              </div>

              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-purple-200">Email</label>
                  <Input
                    id="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={INPUT_CLASS}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-purple-200">Password</label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Create a strong password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`${INPUT_CLASS} pr-12`}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-purple-400 hover:text-white"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {/* Inline password requirements */}
                  {pwChecks && (
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 pt-1">
                      {[
                        { met: pwChecks.length, label: '8+ characters' },
                        { met: pwChecks.upper, label: 'Uppercase letter' },
                        { met: pwChecks.lower, label: 'Lowercase letter' },
                        { met: pwChecks.number, label: 'Number' },
                        { met: pwChecks.special, label: 'Special character' },
                      ].map(({ met, label }) => (
                        <div key={label} className="flex items-center gap-1.5">
                          {met ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                          ) : (
                            <Circle className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
                          )}
                          <span className={`text-[11px] ${met ? 'text-green-400' : 'text-purple-500'}`}>
                            {label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="retro-arcade-btn retro-arcade-btn-green w-full py-3.5 text-sm font-bold tracking-wider disabled:opacity-60"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating account...
                    </span>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </form>

              <p className="text-center text-xs text-purple-300/70">
                Already have an account?{' '}
                <button
                  onClick={() => { resetForm(); setMode('email-password'); }}
                  className="text-cyan-400 hover:underline font-medium"
                >
                  Sign in
                </button>
              </p>
            </>
          )}
        </div>
        </div>
      </PageErrorBoundary>
    );
  }

  // Forgot Password form
  if (mode === 'forgot-password') {
    return (
      <PageErrorBoundary pageName="authentication page">
        <div className="min-h-screen flex flex-col items-center justify-center px-6 pt-safe pb-safe relative" style={{ background: AUTH_BG }}>
          <div className="absolute inset-0 retro-scanlines opacity-[0.03] pointer-events-none" />
          <div className="w-full max-w-sm space-y-6 relative z-[1]">
          <button
            onClick={() => setMode('email-password')}
            className="min-h-[44px] min-w-[44px] flex items-center text-sm text-purple-400 hover:text-white transition-colors -ml-2 px-2"
          >
            ← Back
          </button>

          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto mb-4 rounded-xl flex items-center justify-center"
              style={{ background: 'hsl(260 30% 18%)', border: '2px solid hsl(260 40% 35%)' }}
            >
              <PixelIcon name="ice-cube" size={32} />
            </div>
            <h2 className="text-xl font-bold text-white">Reset Password</h2>
            <p className="text-sm text-purple-300/70">
              Enter your email and we'll send you a link to reset your password
            </p>
          </div>

          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-purple-200">Email</label>
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={INPUT_CLASS}
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              className="retro-arcade-btn retro-arcade-btn-green w-full py-3.5 text-sm font-bold tracking-wider disabled:opacity-60"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </span>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>

          <p className="text-center text-xs text-purple-300/70">
            Remember your password?{' '}
            <button
              onClick={() => { resetForm(); setMode('email-password'); }}
              className="text-cyan-400 hover:underline font-medium"
            >
              Sign in
            </button>
          </p>
        </div>
        </div>
      </PageErrorBoundary>
    );
  }

  // Reset Password form (when user clicks link from email)
  if (mode === 'reset-password') {
    return (
      <PageErrorBoundary pageName="authentication page">
        <div className="min-h-screen flex flex-col items-center justify-center px-6 pt-safe pb-safe relative" style={{ background: AUTH_BG }}>
          <div className="absolute inset-0 retro-scanlines opacity-[0.03] pointer-events-none" />
          <div className="w-full max-w-sm space-y-6 relative z-[1]">
          <button
            onClick={() => { resetForm(); setMode('welcome'); navigate('/auth', { replace: true }); }}
            className="min-h-[44px] min-w-[44px] flex items-center text-sm text-purple-400 hover:text-white transition-colors -ml-2 px-2"
          >
            ← Back
          </button>

          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto mb-4 rounded-xl flex items-center justify-center"
              style={{ background: 'hsl(260 30% 18%)', border: '2px solid hsl(260 40% 35%)' }}
            >
              <PixelIcon name="sword" size={32} />
            </div>
            <h2 className="text-xl font-bold text-white">Set New Password</h2>
            <p className="text-sm text-purple-300/70">
              Enter your new password below
            </p>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-purple-200">New Password</label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${INPUT_CLASS} pr-12`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-purple-400 hover:text-white"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-purple-200">Confirm Password</label>
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={INPUT_CLASS}
                disabled={isLoading}
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-400">Passwords don't match</p>
              )}
            </div>

            <button
              type="submit"
              className="retro-arcade-btn retro-arcade-btn-green w-full py-3.5 text-sm font-bold tracking-wider disabled:opacity-60"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating...
                </span>
              ) : (
                'Update Password'
              )}
            </button>
          </form>
        </div>
        </div>
      </PageErrorBoundary>
    );
  }

  return null;
}
