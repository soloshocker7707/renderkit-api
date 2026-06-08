# RenderKit API - Zuplo Portal Manual Setup Guide

## Overview

After deploying these code changes, you need to manually configure the following in the **Zuplo Portal** (https://portal.zuplo.com).

---

## Step 1: Create Environment Variables

Go to **Settings → Environment Variables** and add these variables:

### Zuplo Configuration
| Variable | Value | Type | Required |
|----------|-------|------|----------|
| `ZUPLO_API_KEY` | Your Zuplo Management API key (from Settings → API Keys) | Secret | ✅ |
| `ZUPLO_GATEWAY_ID` | Your Gateway ID (from Settings → Gateways → Copy ID) | String | ✅ |
| `ZUPLO_ENVIRONMENT` | `production` (or `staging` for testing) | String | ✅ |

### Dodo Payments Configuration
| Variable | Value | Type | Required |
|----------|-------|------|----------|
| `DODO_WEBHOOK_SECRET` | Your Dodo Payments webhook signing secret | Secret | ✅ |

### Supabase (Optional - for production auth)
| Variable | Value | Type | Required |
|----------|-------|------|----------|
| `SUPABASE_URL` | `https://your-project.supabase.co` | String | ❌ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Secret | ❌ |

### Internal Secret
| Variable | Value | Type | Required |
|----------|-------|------|----------|
| `SECRET_ZUPLO` | A shared secret for Vercel verification | Secret | ❌ |

---

## Step 2: Create Consumer Groups

Go to **Settings → Consumer Groups** and create these **4 groups**:

| Group Name | Description |
|-----------|-------------|
| `Free` | Default tier — 250 req/month, 2 rpm |
| `Starter` | Starter plan ($29/mo) — 10,000 req/month, 30 rpm |
| `Expert` | Expert plan ($99/mo) — 50,000 req/month, 120 rpm |
| `Enterprise` | Enterprise plan ($199/mo) — 100,000 req/month, 300 rpm |

Make sure the names match **EXACTLY** (case-sensitive) as shown above.

---

## Step 3: Configure Dodo Payments Webhook

In your **Dodo Payments Dashboard**:

1. Go to **Settings → Webhooks**
2. Add a new webhook endpoint:
   - **URL**: `https://your-zuplo-gateway-url.zuplo.app/webhooks/dodo`
   - **Events to send**:
     - `subscription.created`
     - `subscription.updated`
     - `subscription.cancelled`
     - `order.completed`
3. Copy the **Webhook Signing Secret** and save it as `DODO_WEBHOOK_SECRET` in Zuplo Portal

**Expected webhook payload structure:**
```json
{
  "event_type": "subscription.created",
  "data": {
    "customer": { "email": "user@example.com" },
    "subscription": { "plan_name": "Starter" }
  }
}
```

---

## Step 4: Verify Everything Works

### Test the webhook
```bash
curl -X POST https://your-gateway.zuplo.app/webhooks/dodo \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "subscription.created",
    "data": {
      "customer": { "email": "test@example.com" },
      "subscription": { "plan_name": "Starter" }
    }
  }'
```

Expected response:
```json
{
  "status": "error",
  "message": "Zuplo credentials not configured on server"
}
```
(That's expected if you haven't set `ZUPLO_API_KEY` yet — the webhook handler runs correctly and detects the missing creds.)

### Test tiered rate limiting
```bash
# Free tier (no API key) - should get 2 rpm
curl -X POST https://your-gateway.zuplo.app/v1/screenshot/capture \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'

# Starter tier (mock key)
curl -X POST https://your-gateway.zuplo.app/v1/screenshot/capture \
  -H "x-api-key: pk_test_Starter" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'

# Expert tier (mock key)
curl -X POST https://your-gateway.zuplo.app/v1/screenshot/capture \
  -H "x-api-key: pk_test_Expert" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

---

## Step 5: Create API Keys for Test Users (Optional)

In Zuplo **Settings → Consumers**, add test consumers:

| Email | Group | Notes |
|-------|-------|-------|
| `tester-free@renderkit.com` | `Free` | Gets 250 req/month |
| `tester-starter@renderkit.com` | `Starter` | Gets 10,000 req/month |
| `tester-expert@renderkit.com` | `Expert` | Gets 50,000 req/month |

Then generate API keys for each and distribute to your users.

---

## Tier Summary Table

| Tier | Price | Monthly Limit | Rate Limit | Dodo Plan | Use Case |
|------|-------|--------------|------------|-----------|----------|
| **Free** | $0 | 250 | 2 rpm | N/A (default) | Anonymous trial |
| **Starter** | $29/mo | 10,000 | 30 rpm | Starter | Indie devs |
| **Expert** | $99/mo | 50,000 | 120 rpm | Expert | Small teams |
| **Enterprise** | $199/mo | 100,000 | 300 rpm | Enterprise | Large scale |

**Note:** The mock auth keys allow easy testing:
- `pk_test_Free` → Free tier
- `pk_test_Starter` → Starter tier
- `pk_test_Expert` → Expert tier
- `pk_test_Enterprise` → Enterprise tier
- `pk_b3fe5cf00d7c42be8223ad5ff4a34435` → Starter tier (your hardcoded user "salmasana")