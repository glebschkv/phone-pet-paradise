import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import * as jose from 'https://deno.land/x/jose@v5.2.0/index.ts';

// SECURITY: Simple in-memory rate limiting for receipt validation
// Moderate rate limit - 20 requests per minute (to allow restore purchases)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 20; // 20 requests per minute per user

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

/**
 * Server-side receipt validation for In-App Purchases (StoreKit 2)
 *
 * This Edge Function validates JWS signed transactions from StoreKit 2
 * and updates the user's subscription status in the database.
 *
 * IMPORTANT: This is the ONLY place where subscription status should be set.
 * Client-side code should NEVER directly set subscription status.
 *
 * Validation Flow:
 * 1. Receive JWS signed transaction from client
 * 2. Verify JWS signature using Apple's certificate chain
 * 3. Decode and validate transaction payload
 * 4. Store validated subscription in database
 */

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
    // Return restrictive headers for unknown origins
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

// Apple's root certificate for production and sandbox
// These are Apple's root CA certificates for App Store
// Note: Kept for future certificate pinning implementation
const _APPLE_ROOT_CA_G3_CERTIFICATE = `-----BEGIN CERTIFICATE-----
MIICQzCCAcmgAwIBAgIILcX8iNLFS5UwCgYIKoZIzj0EAwMwZzEbMBkGA1UEAwwS
QXBwbGUgUm9vdCBDQSAtIEczMSYwJAYDVQQLDB1BcHBsZSBDZXJ0aWZpY2F0aW9u
IEF1dGhvcml0eTETMBEGA1UECgwKQXBwbGUgSW5jLjELMAkGA1UEBhMCVVMwHhcN
MTQwNDMwMTgxOTA2WhcNMzkwNDMwMTgxOTA2WjBnMRswGQYDVQQDDBJBcHBsZSBS
b290IENBIC0gRzMxJjAkBgNVBAsMHUFwcGxlIENlcnRpZmljYXRpb24gQXV0aG9y
aXR5MRMwEQYDVQQKDApBcHBsZSBJbmMuMQswCQYDVQQGEwJVUzB2MBAGByqGSM49
AgEGBSuBBAAiA2IABJjpLz1AcqTtkyJygRMc3RCV8cWjTnHcFBbZDuWmBSp3ZHtf
TjjTuxxEtX/1H7YyYl3J6YRbTzBPEVoA/VhYDKX1DyxNB0cTddqXl5dvMVztK517
IDvYuVTZXpmkOlEKMaNCMEAwHQYDVR0OBBYEFLuw3qFYM4iapIqZ3r6966/ayySr
MA8GA1UdEwEB/wQFMAMBAf8wDgYDVR0PAQH/BAQDAgEGMAoGCCqGSM49BAMDA2gA
MGUCMQCD6cHEFl4aXTQY2e3v9GwOAEZLuN+yRhHFD/3meoyhpmvOwgPUnPWTxnS4
at+qIxUCMG1mihDK1A3UT82NQz60imOlM27jbdoXt2QfyFMm+YhidDkLF1vLUagM
6BgD56KyKA==
-----END CERTIFICATE-----`;

// Subscription tier mapping
const SUBSCRIPTION_PRODUCTS: Record<string, { tier: 'premium' | 'premium_plus'; period: 'monthly' | 'yearly' | 'lifetime' }> = {
  'co.nomoinc.nomo.premium.monthly': { tier: 'premium', period: 'monthly' },
  'co.nomoinc.nomo.premium.yearly': { tier: 'premium', period: 'yearly' },
  'co.nomoinc.nomo.premiumplus.monthly': { tier: 'premium_plus', period: 'monthly' },
  'co.nomoinc.nomo.premiumplus.yearly': { tier: 'premium_plus', period: 'yearly' },
  'co.nomoinc.nomo.lifetime': { tier: 'premium_plus', period: 'lifetime' },
};

// Coin pack definitions (consumables)
const COIN_PACK_PRODUCTS: Record<string, { coins: number; bonusCoins: number }> = {
  'co.nomoinc.nomo.coins.value': { coins: 1500, bonusCoins: 300 },
  'co.nomoinc.nomo.coins.premium': { coins: 5000, bonusCoins: 1000 },
  'co.nomoinc.nomo.coins.mega': { coins: 15000, bonusCoins: 5000 },
  'co.nomoinc.nomo.coins.ultra': { coins: 40000, bonusCoins: 20000 },
  'co.nomoinc.nomo.coins.legendary': { coins: 100000, bonusCoins: 50000 },
};

// Starter bundle definitions (non-consumables)
const STARTER_BUNDLE_PRODUCTS: Record<string, {
  coins: number;
  boosterId?: string;
  characterId?: string;
  streakFreezes?: number;
}> = {
  'co.nomoinc.nomo.bundle.welcome': {
    coins: 600,
    boosterId: 'focus_boost',
    streakFreezes: 2
  },
  'co.nomoinc.nomo.bundle.starter': {
    coins: 1000,
    boosterId: 'focus_boost',
    characterId: 'clover-cat'
  },
  'co.nomoinc.nomo.bundle.collector': {
    coins: 5000,
    boosterId: 'super_boost',
    characterId: 'kitsune-spirit'
  },
  'co.nomoinc.nomo.bundle.ultimate': {
    coins: 12000,
    boosterId: 'super_boost',
    characterId: 'storm-spirit',
    streakFreezes: 5
  },
};

type ProductType = 'subscription' | 'coin_pack' | 'starter_bundle';

function getProductType(productId: string): ProductType | null {
  if (SUBSCRIPTION_PRODUCTS[productId]) return 'subscription';
  if (COIN_PACK_PRODUCTS[productId]) return 'coin_pack';
  if (STARTER_BUNDLE_PRODUCTS[productId]) return 'starter_bundle';
  return null;
}

// Expected bundle ID
const EXPECTED_BUNDLE_ID = 'co.nomoinc.nomo';

interface JWSTransactionDecodedPayload {
  transactionId: string;
  originalTransactionId: string;
  bundleId: string;
  productId: string;
  purchaseDate: number;
  originalPurchaseDate: number;
  expiresDate?: number;
  quantity: number;
  type: 'Auto-Renewable Subscription' | 'Non-Consumable' | 'Consumable' | 'Non-Renewing Subscription';
  inAppOwnershipType: 'PURCHASED' | 'FAMILY_SHARED';
  signedDate: number;
  environment: 'Sandbox' | 'Production';
  transactionReason?: 'PURCHASE' | 'RENEWAL';
  storefront: string;
  storefrontId: string;
  revocationDate?: number;
  revocationReason?: number;
  isUpgraded?: boolean;
  offerType?: number;
  offerIdentifier?: string;
}

interface ReceiptValidationRequest {
  signedTransaction: string;
  productId: string;
  transactionId: string;
  originalTransactionId?: string;
  environment: 'sandbox' | 'production';
  platform: 'ios' | 'android';
}

interface SubscriptionRecord {
  user_id: string;
  product_id: string;
  transaction_id: string;
  original_transaction_id: string | null;
  tier: string;
  period: string;
  purchase_date: string;
  expires_at: string | null;
  is_active: boolean;
  platform: string;
  environment: string;
  receipt_data: string | null;
  signed_transaction: string;
  validated_at: string;
}

/**
 * Verify and decode a JWS signed transaction from StoreKit 2
 *
 * StoreKit 2 transactions are signed as JWS (JSON Web Signature) tokens.
 * The signature can be verified using the certificate chain in the x5c header.
 */
async function verifyAndDecodeJWS(signedTransaction: string): Promise<JWSTransactionDecodedPayload> {
  try {
    // Decode the JWS header to get the certificate chain
    const [headerB64] = signedTransaction.split('.');
    const headerJson = new TextDecoder().decode(jose.base64url.decode(headerB64));
    const header = JSON.parse(headerJson);

    if (!header.x5c || !Array.isArray(header.x5c) || header.x5c.length === 0) {
      throw new Error('Missing x5c certificate chain in JWS header');
    }

    // The x5c array contains the certificate chain
    // x5c[0] is the signing certificate (leaf)
    // x5c[1] is the intermediate certificate
    // x5c[2] (if present) would be the root certificate

    // Convert the first certificate (leaf) to PEM format for verification
    const leafCertB64 = header.x5c[0];
    const leafCertPEM = `-----BEGIN CERTIFICATE-----\n${leafCertB64.match(/.{1,64}/g)?.join('\n')}\n-----END CERTIFICATE-----`;

    // Import the leaf certificate's public key
    const alg = header.alg || 'ES256';
    const leafCert = await jose.importX509(leafCertPEM, alg);

    // IMPORTANT: Use compactVerify instead of jwtVerify.
    // StoreKit 2 signed transactions are JWS tokens, NOT JWTs.
    // jwtVerify adds JWT-specific claim validation (exp, nbf, iat) that can
    // reject Apple's JWS tokens which use custom date fields (signedDate,
    // expiresDate) rather than standard JWT claims.
    const { payload: payloadBytes } = await jose.compactVerify(signedTransaction, leafCert);
    const payload = JSON.parse(new TextDecoder().decode(payloadBytes));

    // Validate the certificate chain (basic validation)
    // In production, you should fully validate the chain back to Apple's root CA
    await validateCertificateChain(header.x5c);

    return payload as JWSTransactionDecodedPayload;
  } catch (error) {
    console.error('JWS verification failed:', error);
    throw new Error(`JWS verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate the certificate chain from the JWS x5c header
 *
 * SECURITY: This performs essential validation of Apple's certificate chain.
 * A valid chain must have at least 2 certificates (leaf + intermediate).
 */
async function validateCertificateChain(x5cChain: string[]): Promise<void> {
  // SECURITY: Require at least 2 certificates in the chain
  // Apple's StoreKit 2 always provides a complete chain
  if (x5cChain.length < 2) {
    throw new Error('Invalid certificate chain: must contain at least 2 certificates');
  }

  // Basic validation: ensure certificates are present and properly formatted
  for (let i = 0; i < x5cChain.length; i++) {
    const cert = x5cChain[i];
    if (!cert || typeof cert !== 'string') {
      throw new Error(`Invalid certificate at position ${i}: not a string`);
    }
    if (cert.length < 100) {
      throw new Error(`Invalid certificate at position ${i}: too short`);
    }
    // Check for valid base64 characters
    if (!/^[A-Za-z0-9+/=]+$/.test(cert)) {
      throw new Error(`Invalid certificate at position ${i}: invalid base64 encoding`);
    }
  }

  // Verify we can decode all certificates
  // Apple uses ES256 (P-256) for the leaf cert but ES384 (P-384) for
  // intermediate and root certs, so we try multiple algorithms.
  const ALGORITHMS = ['ES256', 'ES384', 'ES512'] as const;
  for (let i = 0; i < x5cChain.length; i++) {
    const certPEM = `-----BEGIN CERTIFICATE-----\n${x5cChain[i].match(/.{1,64}/g)?.join('\n')}\n-----END CERTIFICATE-----`;
    let parsed = false;
    for (const alg of ALGORITHMS) {
      try {
        await jose.importX509(certPEM, alg);
        parsed = true;
        break;
      } catch {
        // Try next algorithm
      }
    }
    if (!parsed) {
      throw new Error(`Invalid certificate at position ${i}: failed to parse as X.509`);
    }
  }
}

/**
 * Calculate subscription expiration date based on product period
 */
function calculateExpirationDate(purchaseDate: number, period: string): Date | null {
  const purchaseDateObj = new Date(purchaseDate);

  switch (period) {
    case 'monthly':
      return new Date(purchaseDateObj.getTime() + 30 * 24 * 60 * 60 * 1000);
    case 'yearly':
      return new Date(purchaseDateObj.getTime() + 365 * 24 * 60 * 60 * 1000);
    case 'lifetime':
      return null; // Lifetime purchases don't expire
    default:
      return new Date(purchaseDateObj.getTime() + 30 * 24 * 60 * 60 * 1000);
  }
}

serve(async (req) => {
  const origin = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create Supabase client with service role for database operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Use anon key for user authentication
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Use service role key for database operations (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get current user
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
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

    const requestBody: ReceiptValidationRequest = await req.json();
    const { signedTransaction, productId, transactionId, originalTransactionId: _originalTransactionId, environment: _environment, platform } = requestBody;

    if (!signedTransaction || !productId || !transactionId) {
      throw new Error('Missing required fields: signedTransaction, productId, and transactionId');
    }

    // SECURITY: Don't log user IDs or product details to prevent information disclosure

    // Determine product type
    const productType = getProductType(productId);
    if (!productType) {
      throw new Error(`Unknown product ID: ${productId}`);
    }

    // Verify and decode the JWS signed transaction
    // SECURITY: Always require valid JWS verification - never bypass for any environment
    let transactionPayload: JWSTransactionDecodedPayload;

    try {
      transactionPayload = await verifyAndDecodeJWS(signedTransaction);
    } catch (jwsError) {
      // SECURITY: Never bypass JWS verification, even in sandbox mode
      // Apple's sandbox environment provides valid signed transactions for testing
      throw new Error(`JWS verification failed: ${jwsError instanceof Error ? jwsError.message : 'Unknown error'}`);
    }

    // Validate the transaction payload
    if (transactionPayload.bundleId !== EXPECTED_BUNDLE_ID) {
      throw new Error(`Bundle ID mismatch: expected ${EXPECTED_BUNDLE_ID}, got ${transactionPayload.bundleId}`);
    }

    if (transactionPayload.productId !== productId) {
      throw new Error(`Product ID mismatch: expected ${productId}, got ${transactionPayload.productId}`);
    }

    // Check if transaction was revoked
    if (transactionPayload.revocationDate) {
      throw new Error('Transaction has been revoked');
    }

    const now = new Date();

    // ═══════════════════════════════════════════════════════════════════════════
    // HANDLE SUBSCRIPTIONS (Auto-Renewable and Lifetime)
    // ═══════════════════════════════════════════════════════════════════════════
    if (productType === 'subscription') {
      const productInfo = SUBSCRIPTION_PRODUCTS[productId];

      // Calculate expiration date
      let expiresAt: Date | null = null;
      if (transactionPayload.expiresDate) {
        expiresAt = new Date(transactionPayload.expiresDate);
      } else if (productInfo.period !== 'lifetime') {
        expiresAt = calculateExpirationDate(transactionPayload.purchaseDate, productInfo.period);
      }

      // Check for existing subscription with same transaction ID (prevent duplicate processing)
      const { data: existingSubscription } = await supabaseAdmin
        .from('user_subscriptions')
        .select('id, is_active')
        .eq('transaction_id', transactionPayload.transactionId)
        .single();

      if (existingSubscription) {
        // Transaction already processed - return cached result
        return new Response(JSON.stringify({
          success: true,
          message: 'Transaction already processed',
          subscription: {
            tier: productInfo.tier,
            expiresAt: expiresAt?.toISOString() || null,
            productId,
            isActive: existingSubscription.is_active,
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Deactivate any existing active subscriptions for this user
      // (unless this is a renewal for the same original transaction)
      const { error: deactivateError } = await supabaseAdmin
        .from('user_subscriptions')
        .update({ is_active: false, updated_at: now.toISOString() })
        .eq('user_id', user.id)
        .eq('is_active', true)
        .neq('original_transaction_id', transactionPayload.originalTransactionId);

      if (deactivateError) {
        console.warn('Error deactivating old subscriptions:', deactivateError);
      }

      // Insert new subscription record
      const subscriptionRecord: Omit<SubscriptionRecord, 'id'> = {
        user_id: user.id,
        product_id: transactionPayload.productId,
        transaction_id: transactionPayload.transactionId,
        original_transaction_id: transactionPayload.originalTransactionId,
        tier: productInfo.tier,
        period: productInfo.period,
        purchase_date: new Date(transactionPayload.purchaseDate).toISOString(),
        expires_at: expiresAt?.toISOString() || null,
        is_active: true,
        platform,
        environment: transactionPayload.environment.toLowerCase(),
        receipt_data: null,
        signed_transaction: signedTransaction,
        validated_at: now.toISOString(),
      };

      const { error: insertError } = await supabaseAdmin
        .from('user_subscriptions')
        .insert(subscriptionRecord);

      // SECURITY: Fail closed - if we can't persist the subscription, the validation fails
      if (insertError) {
        console.error('Error storing subscription record:', insertError);
        throw new Error('Failed to record subscription. Please try again or restore purchases.');
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Receipt validated successfully',
        productType: 'subscription',
        subscription: {
          tier: productInfo.tier,
          period: productInfo.period,
          expiresAt: expiresAt?.toISOString() || null,
          productId: transactionPayload.productId,
          transactionId: transactionPayload.transactionId,
          purchasedAt: new Date(transactionPayload.purchaseDate).toISOString(),
          environment: transactionPayload.environment.toLowerCase(),
          isLifetime: productInfo.period === 'lifetime',
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // HANDLE COIN PACKS (Consumables)
    // ═══════════════════════════════════════════════════════════════════════════
    if (productType === 'coin_pack') {
      const packInfo = COIN_PACK_PRODUCTS[productId];
      const totalCoins = packInfo.coins + packInfo.bonusCoins;

      // Check for existing transaction (prevent duplicate processing)
      const { data: existingPurchase } = await supabaseAdmin
        .from('user_purchases')
        .select('id')
        .eq('transaction_id', transactionPayload.transactionId)
        .single();

      if (existingPurchase) {
        return new Response(JSON.stringify({
          success: true,
          message: 'Transaction already processed',
          productType: 'coin_pack',
          coinPack: {
            productId,
            coinsGranted: totalCoins,
            alreadyProcessed: true,
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Add coins to user's balance
      const { error: coinError } = await supabaseAdmin.rpc('add_user_coins', {
        p_user_id: user.id,
        p_amount: totalCoins,
        p_source: 'iap_coin_pack',
        p_reference_id: transactionPayload.transactionId,
      });

      if (coinError) {
        console.error('Error adding coins:', coinError);
        throw new Error('Failed to grant coins. Please contact support.');
      }

      // Record the purchase for audit trail
      const { error: purchaseError } = await supabaseAdmin
        .from('user_purchases')
        .insert({
          user_id: user.id,
          product_id: productId,
          transaction_id: transactionPayload.transactionId,
          original_transaction_id: transactionPayload.originalTransactionId,
          product_type: 'coin_pack',
          coins_granted: totalCoins,
          purchase_date: new Date(transactionPayload.purchaseDate).toISOString(),
          platform,
          environment: transactionPayload.environment.toLowerCase(),
          signed_transaction: signedTransaction,
          validated_at: now.toISOString(),
        });

      if (purchaseError) {
        console.warn('Error recording purchase (coins already granted):', purchaseError);
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Coin pack validated and granted',
        productType: 'coin_pack',
        coinPack: {
          productId,
          coinsGranted: totalCoins,
          transactionId: transactionPayload.transactionId,
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // HANDLE STARTER BUNDLES (Non-Consumables)
    // ═══════════════════════════════════════════════════════════════════════════
    if (productType === 'starter_bundle') {
      const bundleInfo = STARTER_BUNDLE_PRODUCTS[productId];

      // Check if bundle already purchased (non-consumable - one time only)
      const { data: existingPurchase } = await supabaseAdmin
        .from('user_purchases')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .eq('product_type', 'starter_bundle')
        .single();

      if (existingPurchase) {
        // Return full bundle contents even when already owned
        // This allows restore purchases to work on new devices
        return new Response(JSON.stringify({
          success: true,
          message: 'Bundle already owned',
          productType: 'starter_bundle',
          bundle: {
            productId,
            alreadyOwned: true,
            // Include contents for restore - coins were already granted originally
            coinsGranted: 0, // Don't re-grant coins
            characterId: bundleInfo.characterId,
            boosterId: bundleInfo.boosterId,
            streakFreezes: bundleInfo.streakFreezes || 0,
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Grant coins
      if (bundleInfo.coins > 0) {
        const { error: coinError } = await supabaseAdmin.rpc('add_user_coins', {
          p_user_id: user.id,
          p_amount: bundleInfo.coins,
          p_source: 'iap_starter_bundle',
          p_reference_id: transactionPayload.transactionId,
        });

        if (coinError) {
          console.error('Error adding bundle coins:', coinError);
          throw new Error('Failed to grant bundle coins. Please contact support.');
        }
      }

      // Record the purchase
      const { error: purchaseError } = await supabaseAdmin
        .from('user_purchases')
        .insert({
          user_id: user.id,
          product_id: productId,
          transaction_id: transactionPayload.transactionId,
          original_transaction_id: transactionPayload.originalTransactionId,
          product_type: 'starter_bundle',
          coins_granted: bundleInfo.coins,
          character_id: bundleInfo.characterId || null,
          booster_id: bundleInfo.boosterId || null,
          streak_freezes_granted: bundleInfo.streakFreezes || 0,
          purchase_date: new Date(transactionPayload.purchaseDate).toISOString(),
          platform,
          environment: transactionPayload.environment.toLowerCase(),
          signed_transaction: signedTransaction,
          validated_at: now.toISOString(),
        });

      if (purchaseError) {
        console.error('Error recording bundle purchase:', purchaseError);
        // Don't fail - coins already granted, client will handle other grants
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Bundle validated and coins granted',
        productType: 'starter_bundle',
        bundle: {
          productId,
          coinsGranted: bundleInfo.coins,
          characterId: bundleInfo.characterId,
          boosterId: bundleInfo.boosterId,
          streakFreezes: bundleInfo.streakFreezes || 0,
          transactionId: transactionPayload.transactionId,
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Should never reach here
    throw new Error(`Unhandled product type: ${productType}`);

  } catch (error) {
    console.error('Receipt validation error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
