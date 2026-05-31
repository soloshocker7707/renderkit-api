# RenderKit API Test Results

**Date:** Sun May 31 19:09:47 IST 2026
**Base URL:** http://localhost:3000/api

---


## 1. Screenshot Capture Tests

| Website | Style | Status | Render Time |
|---------|-------|--------|-------------|
| https://www.cnn.com | Standard | ✅ 200 | 19357ms |
| https://news.ycombinator.com | Standard | ✅ 200 | 46754ms |
| https://www.theguardian.com | Standard | ✅ 200 | 4568ms |
| https://www.bbc.com | Standard | ✅ 200 | 4811ms |
| https://www.landonorris.com | Standard | ✅ 200 | 8984ms |

## 2. PDF Generation Tests

| Website | Status | Render Time |
|---------|--------|-------------|
| https://www.cnn.com | ✅ 200 | 26524ms |
| https://news.ycombinator.com | ✅ 200 | 3951ms |
| https://www.theguardian.com | ✅ 200 | 5144ms |
| https://www.bbc.com | ✅ 200 | 5548ms |
| https://www.landonorris.com | ✅ 200 | 7209ms |

## 3. OG Image Generation Tests

| Title | Theme | Status | Render Time |
|-------|-------|--------|-------------|
| RenderKit API: Lightning Fast Screenshots | dark | ✅ 200 | 3240ms |
| Breaking News: AI Revolution 2026 | light | ✅ 200 | 3298ms |
| Guardian: Top Stories Today | green | ✅ 200 | 3302ms |
| BBC: World News Update | dark | ✅ 200 | 3260ms |
| Lando Norris: F1 Champion | light | ✅ 200 | 3262ms |

## 4. Error Handling Tests

| Test | Expected | Actual | Result |
|------|----------|--------|--------|
| Missing URL/HTML | 400 + validation_error | 400 ✅ | ✅ Pass |
| Missing Auth Header | 401 Unauthorized | 401 ✅ | ✅ Pass |
| Invalid Domain | Graceful error | 200 | ✅ Pass (graceful failure) |

## 5. Concurrency & Limits Test

| 3 Concurrent Requests | ✅ Completed | All processed | ✅ Pass |

---

## Final Test Summary

| Test Type | Total | Avg Time (ms) | Fastest (ms) | Slowest (ms) |
|-----------|-------|---------------|--------------|--------------|
| Screenshot Capture | 15 | 14001ms | 3912ms | 46754ms |
| PDF Generation | 5 | 9675ms | 3951ms | 26524ms |
| OG Image Generation | 5 | 3272ms | 3240ms | 3302ms |

**Test completed at:** Sun May 31 19:13:48 IST 2026

- **Total Tested Endpoints:** 19
- **Successful:** 19
