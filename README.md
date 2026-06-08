# RenderKit Screenshot API 📸

A high-performance API for web screenshots, PDF generation, and Open Graph images. Built with Puppeteer and Chromium, optimized for serverless environments.

## 🚀 Features

- **Web Screenshots**: Capture any URL as PNG or JPEG.
- **PDF Generation**: High-fidelity PDF conversion with customizable formats.
- **Smart Wait Engine**: Auto-stability detection for heavy SPAs and animations.
- **Anti-Bot Stealth**: Integrated User-Agent rotation and footprint evasions.
- **High-Performance Pooling**: Singleton browser pattern for zero cold starts.
- **Resilient Retry Logic**: 3-attempt auto-retry with timeout fallback snapshots.
- **Tiered Rate Limiting**: Dynamic rate limits based on subscription tier.

## 💰 Pricing & Tiers

| Tier | Price | Monthly Requests | Rate Limit |
|------|-------|------------------|------------|
| **Free** | $0 | 250 | 2 RPM |
| **Starter** | $29/mo | 10,000 | 30 RPM |
| **Expert** | $99/mo | 50,000 | 120 RPM |
| **Enterprise** | $199/mo | 100,000 | 300 RPM |

## 📖 Documentation (Postman)

We provide a pre-configured Postman Collection for quick testing.
- **File**: `RenderKitAPI.postman_collection.json`
- **How to use**: Open Postman -> Import -> Select the file.
- **Variables**: Set `baseUrl` and `apiKey` in the collection variables.

## 🚦 API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET    | `/health` | API Status & Version | No |
| POST   | `/v1/screenshot/capture` | Capture PNG/JPEG screenshot (Supports `wait: auto`) | Yes |
| POST   | `/v1/screenshot/pdf` | Generate PDF from URL or HTML | Yes |
| POST   | `/v1/screenshot/og` | Dynamic OG image generation (1200x630) | Yes |

## 📦 Local Development

```bash
npm install
# Ensure you have a local Chrome instance
npm start
```

## 🔒 Configuration

Create a `.env` file in the root directory:
```env
API_KEYS=key1,key2
SECRET_ZUPLO=your-internal-secret
DEBUG_PREVIEW=true
```

---
Built with ❤️ for rapid web utility development.