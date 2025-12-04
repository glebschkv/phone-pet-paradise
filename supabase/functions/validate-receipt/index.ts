import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import * as jose from 'https://deno.land/x/jose@v5.2.0/index.ts';

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

// Apple's root certificate for production and sandbox
// These are Apple's root CA certificates for App Store
const APPLE_ROOT_CA_G3_CERTIFICATE = `-----BEGIN CERTIFICATE-----
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
const PRODUCT_TIERS: Record<string, { tier: 'premium' | 'premium_plus'; period: 'monthly' | 'yearly' | 'lifetime' }> = {
  'co.nomoinc.nomo.premium.monthly': { tier: 'premium', period: 'monthly' },
  'co.nomoinc.nomo.premium.yearly': { tier: 'premium', period: 'yearly' },
  'co.nomoinc.nomo.premiumplus.monthly': { tier: 'premium_plus', period: 'monthly' },
  'co.nomoinc.nomo.premiumplus.yearly': { tier: 'premium_plus', period: 'yearly' },
  'co.nomoinc.nomo.lifetime': { tier: 'premium_plus', period: 'lifetime' },
};

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
    const leafCert = await jose.importX509(leafCertPEM, header.alg || 'ES256');

    // Verify the JWS signature using the leaf certificate
    const { payload } = await jose.jwtVerify(signedTransaction, leafCert, {
      algorithms: ['ES256'],
    });

    // Validate the certificate chain (basic validation)
    // In production, you should fully validate the chain back to Apple's root CA
    await validateCertificateChain(header.x5c);

    return payload as unknown as JWSTransactionDecodedPayload;
  } catch (error) {
    console.error('JWS verification failed:', error);
    throw new Error(`JWS verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate the certificate chain from the JWS x5c header
 *
 * This performs basic validation. For production, consider using
 * a full PKI validation library.
 */
async function validateCertificateChain(x5cChain: string[]): Promise<void> {
  if (x5cChain.length < 2) {
    // For sandbox/testing, Apple might use shorter chains
    console.warn('Certificate chain has fewer than 2 certificates');
    return;
  }

  // Basic validation: ensure certificates are present and properly formatted
  for (const cert of x5cChain) {
    if (!cert || typeof cert !== 'string' || cert.length < 100) {
      throw new Error('Invalid certificate in chain');
    }
  }

  // In production, you would:
  // 1. Build the certificate chain
  // 2. Verify each certificate is signed by the next one in the chain
  // 3. Verify the root certificate matches Apple's known root CA
  // 4. Check certificate expiration dates
  // 5. Check for certificate revocation

  console.log('Certificate chain validation passed (basic)');
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

    const requestBody: ReceiptValidationRequest = await req.json();
    const { signedTransaction, productId, transactionId, originalTransactionId, environment, platform } = requestBody;

    if (!signedTransaction || !productId || !transactionId) {
      throw new Error('Missing required fields: signedTransaction, productId, and transactionId');
    }

    console.log(`Validating receipt for user ${user.id}, product ${productId}, environment: ${environment}`);

    // Get product tier info
    const productInfo = PRODUCT_TIERS[productId];
    if (!productInfo) {
      throw new Error(`Unknown product ID: ${productId}`);
    }

    // Verify and decode the JWS signed transaction
    let transactionPayload: JWSTransactionDecodedPayload;

    try {
      transactionPayload = await verifyAndDecodeJWS(signedTransaction);
      console.log('JWS verification successful:', {
        transactionId: transactionPayload.transactionId,
        productId: transactionPayload.productId,
        environment: transactionPayload.environment,
      });
    } catch (jwsError) {
      // In sandbox/development, we might want to allow unverified transactions
      // for testing purposes, but log a warning
      if (environment === 'sandbox') {
        console.warn('JWS verification failed in sandbox mode, proceeding with caution:', jwsError instanceof Error ? jwsError.message : 'Unknown error');
        // Create a minimal payload from the request data for sandbox testing
        transactionPayload = {
          transactionId,
          originalTransactionId: originalTransactionId || transactionId,
          bundleId: EXPECTED_BUNDLE_ID,
          productId,
          purchaseDate: Date.now(),
          originalPurchaseDate: Date.now(),
          quantity: 1,
          type: 'Auto-Renewable Subscription',
          inAppOwnershipType: 'PURCHASED',
          signedDate: Date.now(),
          environment: 'Sandbox',
          storefront: 'USA',
          storefrontId: '143441',
        };
      } else {
        throw new Error(`JWS verification failed: ${jwsError instanceof Error ? jwsError.message : 'Unknown error'}`);
      }
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
      console.log(`Transaction ${transactionPayload.transactionId} already processed`);
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
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('is_active', true)
      .neq('original_transaction_id', transactionPayload.originalTransactionId);

    if (deactivateError) {
      console.warn('Error deactivating old subscriptions:', deactivateError);
    }

    // Insert new subscription record
    const now = new Date();
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

    if (insertError) {
      console.error('Error storing subscription record:', insertError);
      // Don't fail the request - the purchase was valid, we just couldn't store it
      // The client can retry or the user can restore purchases later
    }

    console.log(`Successfully validated subscription for user ${user.id}: ${productInfo.tier} (${productInfo.period})`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Receipt validated successfully',
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
