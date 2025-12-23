# Production Deployment Checklist

This checklist covers all the steps required to deploy NoMo Phone to production.

## Pre-Deployment Requirements

### 1. Environment Configuration

#### Frontend (.env file)
Copy `.env.example` to `.env` and configure:

```bash
# Required - Supabase Configuration
VITE_SUPABASE_PROJECT_ID="your-actual-project-id"
VITE_SUPABASE_PUBLISHABLE_KEY="your-actual-anon-key"
VITE_SUPABASE_URL="https://your-project-id.supabase.co"

# Required for Production
VITE_APP_URL="https://your-production-domain.com"
VITE_SENTRY_DSN="your-sentry-dsn"
VITE_APP_VERSION="1.0.0"
```

#### Supabase Edge Functions
Set these secrets in your Supabase project dashboard (Settings > Edge Functions):

```bash
# Required
ALLOWED_ORIGINS=https://app.nomoinc.co,https://www.nomoinc.co
ENVIRONMENT=production

# These are auto-configured by Supabase
# SUPABASE_URL (auto-set)
# SUPABASE_ANON_KEY (auto-set)
# SUPABASE_SERVICE_ROLE_KEY (auto-set)
```

#### Supabase Auth Configuration
Update `supabase/config.toml` for production:

```toml
[auth]
site_url = "https://app.nomoinc.co"
additional_redirect_urls = [
  "https://app.nomoinc.co",
  "https://www.nomoinc.co",
  "capacitor://localhost",
  "ionic://localhost"
]

[auth.email]
enable_confirmations = true  # Enable email verification
```

---

## Deployment Checklist

### Phase 1: Infrastructure Setup

- [ ] **Supabase Production Project**
  - [ ] Create production Supabase project
  - [ ] Run all migrations (`supabase db push`)
  - [ ] Verify RLS policies are enabled on all tables
  - [ ] Configure auth settings (site_url, redirect_urls)
  - [ ] Set Edge Function secrets (ALLOWED_ORIGINS, ENVIRONMENT=production)

- [ ] **Error Tracking**
  - [ ] Create Sentry project at https://sentry.io
  - [ ] Copy DSN to `VITE_SENTRY_DSN` environment variable
  - [ ] Configure source maps upload (optional but recommended)

- [ ] **Domain & Hosting**
  - [ ] Configure production domain
  - [ ] Set up SSL certificate (HTTPS required)
  - [ ] Configure CDN (recommended for assets)

### Phase 2: Build & Test

- [ ] **Build Verification**
  ```bash
  npm run lint          # Fix any linting errors
  npm run build         # Production build
  npm run preview       # Test production build locally
  ```

- [ ] **Security Verification**
  - [ ] Verify no `.env` files are committed
  - [ ] Verify no hardcoded secrets in codebase
  - [ ] Test CORS configuration with production domains
  - [ ] Verify rate limiting works on Edge Functions
  - [ ] Test authentication flow end-to-end

- [ ] **Functionality Testing**
  - [ ] User registration and login
  - [ ] Focus timer sessions
  - [ ] XP and leveling system
  - [ ] Achievement unlocks
  - [ ] Streak tracking
  - [ ] Pet interactions
  - [ ] Coin system

### Phase 3: iOS Deployment

- [ ] **Apple Developer Setup** ($99/year required)
  - [ ] Enroll in Apple Developer Program
  - [ ] Create App ID with bundle identifier `co.nomoinc.nomo`
  - [ ] Enable "Family Controls" capability
  - [ ] Enable "App Groups" capability
  - [ ] Create provisioning profiles

- [ ] **Xcode Configuration**
  - [ ] Open `ios/App/App.xcworkspace` in Xcode
  - [ ] Configure signing with your Apple Developer account
  - [ ] Add required entitlements:
    - `com.apple.developer.family-controls`
    - `com.apple.security.application-groups`
  - [ ] Test on physical iOS device (required for DeviceActivity API)

- [ ] **App Store Submission**
  - [ ] Create App Store Connect record
  - [ ] Upload screenshots (required sizes in docs/APP_STORE_METADATA.md)
  - [ ] Fill in metadata from docs/APP_STORE_METADATA.md
  - [ ] Submit for App Review

### Phase 4: Android Deployment (Optional)

- [ ] **Google Play Setup**
  - [ ] Create Google Play Developer account ($25 one-time)
  - [ ] Create app listing
  - [ ] Configure signing

- [ ] **Build & Upload**
  ```bash
  npx cap sync android
  # Build release APK/AAB in Android Studio
  ```

### Phase 5: StoreKit 2 / In-App Purchases

- [ ] **App Store Connect Configuration**
  - [ ] Create subscription products
  - [ ] Configure pricing
  - [ ] Set up subscription groups

- [ ] **Receipt Validation**
  - [ ] Deploy `validate-receipt` Edge Function
  - [ ] Test sandbox purchases
  - [ ] Test production purchases

---

## Post-Deployment

### Monitoring Setup

- [ ] **Sentry Alerts**
  - [ ] Configure error alert rules
  - [ ] Set up performance monitoring alerts
  - [ ] Add team members to notifications

- [ ] **Database Monitoring**
  - [ ] Enable Supabase monitoring dashboard
  - [ ] Set up database backup schedule
  - [ ] Monitor connection pool usage

- [ ] **Application Monitoring**
  - [ ] Set up uptime monitoring (e.g., UptimeRobot, Pingdom)
  - [ ] Configure response time alerts

### Maintenance Tasks

- [ ] **Regular Updates**
  - [ ] Keep dependencies updated (`npm outdated`)
  - [ ] Review and update RLS policies as needed
  - [ ] Monitor Sentry for new error patterns

- [ ] **Database Maintenance**
  - [ ] Review query performance
  - [ ] Add indexes as usage patterns emerge
  - [ ] Clean up old session data periodically

---

## Quick Reference: Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase anon key |
| `VITE_SUPABASE_PROJECT_ID` | Yes | Supabase project ID |
| `VITE_APP_URL` | Production | App URL for OAuth redirects |
| `VITE_SENTRY_DSN` | Production | Sentry error tracking DSN |
| `VITE_APP_VERSION` | Optional | App version for tracking |

### Edge Function Secrets

| Secret | Required | Description |
|--------|----------|-------------|
| `ALLOWED_ORIGINS` | Production | Comma-separated list of allowed origins |
| `ENVIRONMENT` | Production | Set to "production" |

---

## Troubleshooting

### CORS Errors
- Verify `ALLOWED_ORIGINS` includes your production domain
- Check that `ENVIRONMENT=production` is set
- Ensure URLs don't have trailing slashes

### Authentication Issues
- Verify `site_url` matches your production domain
- Check `additional_redirect_urls` includes all app URLs
- For mobile: ensure `capacitor://localhost` is in redirect URLs

### Edge Function Errors
- Check Supabase dashboard logs
- Verify all secrets are set correctly
- Test with `supabase functions serve` locally first

---

## Security Reminders

1. **Never commit `.env` files** - they're in `.gitignore`
2. **Rotate keys if exposed** - regenerate Supabase keys immediately
3. **Use HTTPS only** - never serve over HTTP in production
4. **Enable email verification** - set `enable_confirmations = true`
5. **Monitor rate limits** - watch for abuse patterns in logs
