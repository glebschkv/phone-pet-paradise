/**
 * Environment Configuration & Validation
 *
 * This module validates required environment variables and provides
 * typed access to configuration values throughout the application.
 */

interface EnvConfig {
  // Supabase
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseProjectId: string;

  // App
  appUrl: string;
  appVersion: string;

  // Error tracking
  sentryDsn: string | null;

  // Environment
  isProduction: boolean;
  isDevelopment: boolean;
  mode: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate all required environment variables
 */
export function validateEnvironment(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required for all environments
  if (!import.meta.env.VITE_SUPABASE_URL) {
    errors.push('VITE_SUPABASE_URL is required');
  }

  if (!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
    errors.push('VITE_SUPABASE_PUBLISHABLE_KEY is required');
  }

  // Production-only requirements
  if (import.meta.env.PROD) {
    if (!import.meta.env.VITE_SENTRY_DSN) {
      warnings.push('VITE_SENTRY_DSN is not set - error tracking will be disabled in production');
    }

    if (!import.meta.env.VITE_APP_URL) {
      warnings.push('VITE_APP_URL is not set - OAuth redirects may not work correctly');
    }

    // Check for placeholder values that weren't replaced
    if (import.meta.env.VITE_SUPABASE_URL?.includes('your-project-id')) {
      errors.push('VITE_SUPABASE_URL contains placeholder value - update with actual Supabase URL');
    }

    if (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.includes('your-anon-key')) {
      errors.push('VITE_SUPABASE_PUBLISHABLE_KEY contains placeholder value');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get validated environment configuration
 * Throws in production if required variables are missing
 */
export function getEnvConfig(): EnvConfig {
  const validation = validateEnvironment();

  // In production, fail fast if config is invalid
  if (import.meta.env.PROD && !validation.isValid) {
    console.error('Environment configuration errors:', validation.errors);
    throw new Error(`Invalid environment configuration: ${validation.errors.join(', ')}`);
  }

  // In development, log warnings but continue
  if (import.meta.env.DEV) {
    if (validation.errors.length > 0) {
      console.warn('Environment configuration errors (dev mode - continuing anyway):', validation.errors);
    }
    if (validation.warnings.length > 0) {
      console.warn('Environment configuration warnings:', validation.warnings);
    }
  }

  return {
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '',
    supabaseProjectId: import.meta.env.VITE_SUPABASE_PROJECT_ID || '',
    appUrl: import.meta.env.VITE_APP_URL || window.location.origin,
    appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
    sentryDsn: import.meta.env.VITE_SENTRY_DSN || null,
    isProduction: import.meta.env.PROD,
    isDevelopment: import.meta.env.DEV,
    mode: import.meta.env.MODE,
  };
}

/**
 * Log environment info (safe for production - no secrets)
 */
export function logEnvironmentInfo(): void {
  const config = getEnvConfig();

  console.log('[Env] Mode:', config.mode);
  console.log('[Env] Production:', config.isProduction);
  console.log('[Env] Supabase configured:', !!config.supabaseUrl);
  console.log('[Env] Sentry configured:', !!config.sentryDsn);
  console.log('[Env] App version:', config.appVersion);
}

// Export singleton config (validated on first access)
let _config: EnvConfig | null = null;

export function env(): EnvConfig {
  if (!_config) {
    _config = getEnvConfig();
  }
  return _config;
}
