/**
 * Shared CORS configuration for all edge functions.
 *
 * Unifies origin handling across validate-coins, calculate-xp,
 * process-achievements, delete-account, and validate-receipt.
 */

const getProductionOrigins = (): string[] => {
  const envOrigins = Deno.env.get('ALLOWED_ORIGINS');
  if (envOrigins) {
    return envOrigins.split(',').map(o => o.trim()).filter(Boolean);
  }
  return [];
};

const STATIC_ALLOWED_ORIGINS = [
  // Mobile app origins (always allowed)
  'capacitor://localhost',
  'ionic://localhost',
];

// Only allow localhost in development/test environments
const isDevelopment = Deno.env.get('ENVIRONMENT') !== 'production';
const DEV_ORIGINS = isDevelopment
  ? ['http://localhost:5173', 'http://localhost:8080', 'http://localhost:3000']
  : [];

export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;

  // Check static origins
  if (STATIC_ALLOWED_ORIGINS.includes(origin)) return true;

  // Check dev origins
  if (DEV_ORIGINS.includes(origin)) return true;

  // Check production origins from env
  const productionOrigins = getProductionOrigins();
  if (productionOrigins.includes(origin)) return true;

  // Allow Lovable preview domains (exact subdomain match only)
  try {
    const url = new URL(origin);
    const host = url.hostname;
    if (host.endsWith('.lovableproject.com') || host.endsWith('.lovable.app')) return true;
  } catch {
    // Invalid URL — reject
  }

  return false;
}

export function getCorsHeaders(origin: string | null): Record<string, string> {
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
}
