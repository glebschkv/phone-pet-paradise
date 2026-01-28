import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Mail, Lock, Sparkles, User, ArrowRight, Loader2 } from 'lucide-react';
import { getAppBaseUrl, isValidEmail, validatePassword, sanitizeErrorMessage } from '@/lib/apiUtils';
import { PageErrorBoundary } from '@/components/PageErrorBoundary';
import { checkRateLimit, recordRateLimitAttempt, clearRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/security';
import { Capacitor } from '@capacitor/core';

// Apple logo SVG component
const AppleIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83" />
  </svg>
);

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
      toast.success('Check your email!', {
        description: 'We sent you a magic link to sign in.',
      });
      setMode('welcome');
    } catch (error: unknown) {
      const message = sanitizeErrorMessage(error);
      if (message) toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
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
        toast.info('Account may already exist', {
          description: 'Try signing in or use "Forgot Password" to recover your account.',
        });
        setMode('email-password');
        setIsLoading(false);
        return;
      }

      // Clear rate limit on success
      clearRateLimit(rateLimitKey);
      toast.success('Check your email!', {
        description: 'Click the confirmation link we sent to verify your account.',
      });
      setMode('welcome');
    } catch (error: unknown) {
      const message = sanitizeErrorMessage(error);
      if (message) toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
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
    setIsLoading(true);
    try {
      const isNativeIOS = Capacitor.getPlatform() === 'ios';
      
      if (isNativeIOS) {
        // Use native Sign in with Apple for iOS
        const { SignInWithApple } = await import('@capacitor-community/apple-sign-in');
        
        const options = {
          clientId: 'co.nomoinc.nomo',
          redirectURI: getRedirectUrl(),
          scopes: 'email name',
          state: crypto.randomUUID(),
          nonce: crypto.randomUUID(),
        };
        
        const result = await SignInWithApple.authorize(options);
        
        // Use Supabase's signInWithIdToken for native auth
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: result.response.identityToken,
          nonce: options.nonce,
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
      // If native fails, try web fallback
      if (Capacitor.getPlatform() === 'ios') {
        try {
          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'apple',
            options: {
              redirectTo: getRedirectUrl(),
            },
          });
          if (error) throw error;
        } catch (fallbackError) {
          const message = sanitizeErrorMessage(fallbackError);
          if (message) toast.error(message);
        }
      } else {
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
        <div className="min-h-screen flex items-center justify-center" style={{
          background: 'linear-gradient(180deg, hsl(200 60% 85%) 0%, hsl(200 40% 92%) 50%, hsl(40 50% 93%) 100%)'
        }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </PageErrorBoundary>
    );
  }

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  // Welcome screen with options
  if (mode === 'welcome') {
    return (
      <PageErrorBoundary pageName="authentication page">
        <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{
          background: 'linear-gradient(180deg, hsl(200 60% 85%) 0%, hsl(200 40% 92%) 50%, hsl(40 50% 93%) 100%)'
        }}>
          <div className="w-full max-w-sm space-y-8">
          {/* Logo/Title */}
          <div className="text-center space-y-2">
            <img
              src="/app-icon.png"
              alt="NoMo"
              className="w-20 h-20 mx-auto mb-4 rounded-2xl shadow-lg"
            />
            <h1 className="text-2xl font-bold text-foreground">NoMo</h1>
            <p className="text-sm text-muted-foreground">Focus, grow, and collect pets!</p>
          </div>

          {/* Auth Options */}
          <div className="space-y-3">
            {/* Apple Sign-In - Primary option */}
            <button
              onClick={handleAppleSignIn}
              disabled={isLoading}
              className="w-full p-4 rounded-xl flex items-center gap-4 transition-all active:scale-[0.98] hover:shadow-lg bg-black text-white disabled:opacity-50"
            >
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <AppleIcon className="w-5 h-5" />
                )}
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold text-sm">Continue with Apple</p>
                <p className="text-xs text-white/70">Fast & private sign in</p>
              </div>
              <ArrowRight className="w-4 h-4 text-white/50" />
            </button>

            <button
              onClick={() => { resetForm(); setMode('magic-link'); }}
              className="w-full p-4 retro-card rounded-xl flex items-center gap-4 transition-all active:scale-[0.98] hover:shadow-lg"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold text-sm">Continue with Email</p>
                <p className="text-xs text-muted-foreground">Passwordless magic link</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </button>

            <button
              onClick={() => { resetForm(); setMode('email-password'); }}
              className="w-full p-4 retro-card rounded-xl flex items-center gap-4 transition-all active:scale-[0.98] hover:shadow-lg"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Lock className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold text-sm">Sign in with Password</p>
                <p className="text-xs text-muted-foreground">Use email and password</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/50"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-[hsl(200_40%_92%)] px-3 text-muted-foreground">or</span>
              </div>
            </div>

            <button
              onClick={handleGuestMode}
              className="w-full p-4 rounded-xl flex items-center gap-4 transition-all active:scale-[0.98] border-2 border-dashed border-border/50 hover:border-primary/30"
            >
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <User className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold text-sm text-muted-foreground">Continue as Guest</p>
                <p className="text-xs text-muted-foreground">No account needed</p>
              </div>
            </button>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Guest progress is saved locally and won't sync across devices
          </p>
        </div>
        </div>
      </PageErrorBoundary>
    );
  }

  // Magic Link form
  if (mode === 'magic-link') {
    return (
      <PageErrorBoundary pageName="authentication page">
        <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{
          background: 'linear-gradient(180deg, hsl(200 60% 85%) 0%, hsl(200 40% 92%) 50%, hsl(40 50% 93%) 100%)'
        }}>
          <div className="w-full max-w-sm space-y-6">
          <button
            onClick={() => setMode('welcome')}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back
          </button>

          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center">
              <Mail className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Magic Link</h2>
            <p className="text-sm text-muted-foreground">
              We'll email you a link to sign in instantly
            </p>
          </div>

          <form onSubmit={handleMagicLink} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-xl"
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Magic Link'
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            Don't have an account?{' '}
            <button
              onClick={() => setMode('signup')}
              className="text-primary hover:underline font-medium"
            >
              Sign up
            </button>
          </p>
        </div>
        </div>
      </PageErrorBoundary>
    );
  }

  // Email + Password Sign In
  if (mode === 'email-password') {
    return (
      <PageErrorBoundary pageName="authentication page">
        <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{
          background: 'linear-gradient(180deg, hsl(200 60% 85%) 0%, hsl(200 40% 92%) 50%, hsl(40 50% 93%) 100%)'
        }}>
          <div className="w-full max-w-sm space-y-6">
          <button
            onClick={() => setMode('welcome')}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back
          </button>

          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center">
              <Lock className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Sign In</h2>
            <p className="text-sm text-muted-foreground">
              Welcome back! Enter your credentials
            </p>
          </div>

          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-xl"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <button
                  type="button"
                  onClick={() => { setMode('forgot-password'); }}
                  className="text-xs text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-xl"
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            Don't have an account?{' '}
            <button
              onClick={() => { resetForm(); setMode('signup'); }}
              className="text-primary hover:underline font-medium"
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
    return (
      <PageErrorBoundary pageName="authentication page">
        <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{
          background: 'linear-gradient(180deg, hsl(200 60% 85%) 0%, hsl(200 40% 92%) 50%, hsl(40 50% 93%) 100%)'
        }}>
          <div className="w-full max-w-sm space-y-6">
          <button
            onClick={() => setMode('welcome')}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back
          </button>

          <div className="text-center space-y-2">
            <img
              src="/app-icon.png"
              alt="NoMo"
              className="w-14 h-14 mx-auto mb-4 rounded-xl shadow-md"
            />
            <h2 className="text-xl font-bold">Create Account</h2>
            <p className="text-sm text-muted-foreground">
              Join NoMo and sync your progress
            </p>
          </div>

          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-xl"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-xl"
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            Already have an account?{' '}
            <button
              onClick={() => { resetForm(); setMode('email-password'); }}
              className="text-primary hover:underline font-medium"
            >
              Sign in
            </button>
          </p>
        </div>
        </div>
      </PageErrorBoundary>
    );
  }

  // Forgot Password form
  if (mode === 'forgot-password') {
    return (
      <PageErrorBoundary pageName="authentication page">
        <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{
          background: 'linear-gradient(180deg, hsl(200 60% 85%) 0%, hsl(200 40% 92%) 50%, hsl(40 50% 93%) 100%)'
        }}>
          <div className="w-full max-w-sm space-y-6">
          <button
            onClick={() => setMode('email-password')}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back
          </button>

          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center">
              <Lock className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Reset Password</h2>
            <p className="text-sm text-muted-foreground">
              Enter your email and we'll send you a link to reset your password
            </p>
          </div>

          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-xl"
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Reset Link'
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            Remember your password?{' '}
            <button
              onClick={() => { resetForm(); setMode('email-password'); }}
              className="text-primary hover:underline font-medium"
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
        <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{
          background: 'linear-gradient(180deg, hsl(200 60% 85%) 0%, hsl(200 40% 92%) 50%, hsl(40 50% 93%) 100%)'
        }}>
          <div className="w-full max-w-sm space-y-6">
          <button
            onClick={() => { resetForm(); setMode('welcome'); navigate('/auth', { replace: true }); }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back
          </button>

          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center">
              <Lock className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Set New Password</h2>
            <p className="text-sm text-muted-foreground">
              Enter your new password below
            </p>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">New Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-xl"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-12 rounded-xl"
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Password'
              )}
            </Button>
          </form>
        </div>
        </div>
      </PageErrorBoundary>
    );
  }

  return null;
}
