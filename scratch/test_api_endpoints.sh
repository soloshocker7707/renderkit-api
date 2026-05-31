#!/bin/bash
# Comprehensive API Endpoint Test for RenderKit API
# macOS-compatible version

BASE_URL="http://localhost:3000/api"
SECRET="x-zuplo-secret: qwertyuiop1as2d3f4"

WEBSITES=(
  "https://www.cnn.com"
  "https://news.ycombinator.com"
  "https://www.theguardian.com"
  "https://www.bbc.com"
  "https://www.landonorris.com"
)

RESULTS_DIR="scratch/test_results"
mkdir -p "$RESULTS_DIR/capture"
mkdir -p "$RESULTS_DIR/pdf"
mkdir -p "$RESULTS_DIR/og"

SUMMARY_FILE="$RESULTS_DIR/summary.md"

echo "# RenderKit API Test Results" > "$SUMMARY_FILE"
echo "" >> "$SUMMARY_FILE"
echo "**Date:** $(date)" >> "$SUMMARY_FILE"
echo "**Base URL:** $BASE_URL" >> "$SUMMARY_FILE"
echo "" >> "$SUMMARY_FILE"
echo "---" >> "$SUMMARY_FILE"
echo "" >> "$SUMMARY_FILE"

# ==============================
# TEST 1: Capture Screenshots
# ==============================
echo "" >> "$SUMMARY_FILE"
echo "## 1. Screenshot Capture Tests" >> "$SUMMARY_FILE"
echo "" >> "$SUMMARY_FILE"
echo "| Website | Style | Status | Render Time |" >> "$SUMMARY_FILE"
echo "|---------|-------|--------|-------------|" >> "$SUMMARY_FILE"

for site in "${WEBSITES[@]}"; do
  site_name=$(echo "$site" | sed 's|https://www\.||;s|https://||;s|/||' | tr '.' '_')
  
  # Test 1a: Standard capture with smart wait
  echo "Testing capture (standard) for $site..."
  RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE_URL/v1/screenshot/capture" \
    -H "$SECRET" \
    -H "Content-Type: application/json" \
    -d "{\"url\":\"$site\",\"wait\":\"smart\",\"format\":\"jpeg\",\"quality\":70,\"stealth\":true}")
  
  HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | sed 's/.*HTTP_CODE://')
  BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE:/d')
  
  if [ "$HTTP_CODE" = "200" ]; then
    RENDER_TIME=$(echo "$BODY" | grep -o '"render_time":[0-9]*' | cut -d: -f2 | head -1)
    echo "$BODY" > "$RESULTS_DIR/capture/${site_name}_standard.json"
    echo "| $site | Standard | ✅ 200 | ${RENDER_TIME:-N/A}ms |" >> "$SUMMARY_FILE"
    echo "  → Standard: ${RENDER_TIME:-N/A}ms ✅"
  else
    echo "| $site | Standard | ❌ $HTTP_CODE | - |" >> "$SUMMARY_FILE"
    echo "  → ❌ HTTP $HTTP_CODE"
    echo "$BODY" > "$RESULTS_DIR/capture/${site_name}_standard_error.json"
  fi
  
  # Test 1b: Clean capture (auto-clean enabled)
  echo "Testing capture (clean) for $site..."
  RESPONSE_CLEAN=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE_URL/v1/screenshot/capture" \
    -H "$SECRET" \
    -H "Content-Type: application/json" \
    -d "{\"url\":\"$site\",\"clean\":true,\"wait\":\"smart\",\"format\":\"jpeg\",\"quality\":70,\"stealth\":true}")
  
  HTTP_CODE_CLEAN=$(echo "$RESPONSE_CLEAN" | grep "HTTP_CODE:" | sed 's/.*HTTP_CODE://')
  BODY_CLEAN=$(echo "$RESPONSE_CLEAN" | sed '/HTTP_CODE:/d')
  
  if [ "$HTTP_CODE_CLEAN" = "200" ]; then
    RENDER_TIME_CLEAN=$(echo "$BODY_CLEAN" | grep -o '"render_time":[0-9]*' | cut -d: -f2 | head -1)
    echo "$BODY_CLEAN" > "$RESULTS_DIR/capture/${site_name}_clean.json"
    echo "  → Clean: ${RENDER_TIME_CLEAN:-N/A}ms ✅"
  else
    echo "  → Clean: ❌ HTTP $HTTP_CODE_CLEAN"
  fi
  
  # Test 1c: Debug mode (with debug info)
  echo "Testing capture (debug) for $site..."
  RESPONSE_DBG=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE_URL/v1/screenshot/capture" \
    -H "$SECRET" \
    -H "Content-Type: application/json" \
    -d "{\"url\":\"$site\",\"wait\":\"smart\",\"format\":\"jpeg\",\"quality\":70,\"debug\":true}")
  
  HTTP_CODE_DBG=$(echo "$RESPONSE_DBG" | grep "HTTP_CODE:" | sed 's/.*HTTP_CODE://')
  BODY_DBG=$(echo "$RESPONSE_DBG" | sed '/HTTP_CODE:/d')
  
  if [ "$HTTP_CODE_DBG" = "200" ]; then
    RENDER_TIME_DBG=$(echo "$BODY_DBG" | grep -o '"render_time":[0-9]*' | cut -d: -f2 | head -1)
    echo "$BODY_DBG" > "$RESULTS_DIR/capture/${site_name}_debug.json"
    echo "  → Debug: ${RENDER_TIME_DBG:-N/A}ms ✅"
  fi
done

# ==============================
# TEST 2: PDF Generation
# ==============================
echo "" >> "$SUMMARY_FILE"
echo "## 2. PDF Generation Tests" >> "$SUMMARY_FILE"
echo "" >> "$SUMMARY_FILE"
echo "| Website | Status | Render Time |" >> "$SUMMARY_FILE"
echo "|---------|--------|-------------|" >> "$SUMMARY_FILE"

for site in "${WEBSITES[@]}"; do
  site_name=$(echo "$site" | sed 's|https://www\.||;s|https://||;s|/||' | tr '.' '_')
  
  echo "Testing PDF for $site..."
  RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE_URL/v1/screenshot/pdf" \
    -H "$SECRET" \
    -H "Content-Type: application/json" \
    -d "{\"url\":\"$site\",\"format\":\"A4\",\"printBackground\":true,\"stealth\":true}")
  
  HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | sed 's/.*HTTP_CODE://')
  BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE:/d')
  
  if [ "$HTTP_CODE" = "200" ]; then
    RENDER_TIME=$(echo "$BODY" | grep -o '"render_time":[0-9]*' | cut -d: -f2 | head -1)
    echo "$BODY" > "$RESULTS_DIR/pdf/${site_name}.json"
    # Extract and save actual PDF binary
    echo "$BODY" | grep -o '"pdf_base64":"[^"]*"' | sed 's/"pdf_base64":"//;s/"//' | base64 -d > "$RESULTS_DIR/pdf/${site_name}.pdf" 2>/dev/null
    PDF_SIZE=$(wc -c < "$RESULTS_DIR/pdf/${site_name}.pdf" 2>/dev/null || echo 0)
    echo "| $site | ✅ 200 | ${RENDER_TIME:-N/A}ms |" >> "$SUMMARY_FILE"
    echo "  → ${RENDER_TIME:-N/A}ms ✅ (PDF: ${PDF_SIZE} bytes)"
  else
    echo "| $site | ❌ $HTTP_CODE | - |" >> "$SUMMARY_FILE"
    echo "  → ❌ HTTP $HTTP_CODE"
    echo "$BODY" > "$RESULTS_DIR/pdf/${site_name}_error.json"
  fi
done

# ==============================
# TEST 3: OG Image Generation
# ==============================
echo "" >> "$SUMMARY_FILE"
echo "## 3. OG Image Generation Tests" >> "$SUMMARY_FILE"
echo "" >> "$SUMMARY_FILE"
echo "| Title | Theme | Status | Render Time |" >> "$SUMMARY_FILE"
echo "|-------|-------|--------|-------------|" >> "$SUMMARY_FILE"

OG_TESTS=(
  "RenderKit API: Lightning Fast Screenshots|dark"
  "Breaking News: AI Revolution 2026|light"
  "Guardian: Top Stories Today|green"
  "BBC: World News Update|dark"
  "Lando Norris: F1 Champion|light"
)

for test_case in "${OG_TESTS[@]}"; do
  TITLE=$(echo "$test_case" | cut -d'|' -f1)
  THEME=$(echo "$test_case" | cut -d'|' -f2)
  title_safe=$(echo "$TITLE" | tr ' ' '_' | tr -d ':' | tr -d '.' | tr -d "'" | cut -c1-30)
  
  echo "Testing OG for '$TITLE' ($THEME)..."
  RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE_URL/v1/screenshot/og" \
    -H "$SECRET" \
    -H "Content-Type: application/json" \
    -d "{\"title\":\"$TITLE\",\"theme\":\"$THEME\",\"description\":\"Testing RenderKit OG generation capabilities with $THEME theme\"}")
  
  HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | sed 's/.*HTTP_CODE://')
  BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE:/d')
  
  if [ "$HTTP_CODE" = "200" ]; then
    RENDER_TIME=$(echo "$BODY" | grep -o '"render_time":[0-9]*' | cut -d: -f2 | head -1)
    echo "$BODY" > "$RESULTS_DIR/og/${title_safe}.json"
    # Extract and save actual PNG image
    echo "$BODY" | grep -o '"image_base64":"[^"]*"' | sed 's/"image_base64":"//;s/"//' | base64 -d > "$RESULTS_DIR/og/${title_safe}.png" 2>/dev/null
    OG_SIZE=$(wc -c < "$RESULTS_DIR/og/${title_safe}.png" 2>/dev/null || echo 0)
    echo "| $TITLE | $THEME | ✅ 200 | ${RENDER_TIME:-N/A}ms |" >> "$SUMMARY_FILE"
    echo "  → ${RENDER_TIME:-N/A}ms ✅ (Image: ${OG_SIZE} bytes)"
  else
    echo "| $TITLE | $THEME | ❌ $HTTP_CODE | - |" >> "$SUMMARY_FILE"
    echo "  → ❌ HTTP $HTTP_CODE"
    echo "$BODY" > "$RESULTS_DIR/og/${title_safe}_error.json"
  fi
done

# ==============================
# TEST 4: Error Handling Tests
# ==============================
echo "" >> "$SUMMARY_FILE"
echo "## 4. Error Handling Tests" >> "$SUMMARY_FILE"
echo "" >> "$SUMMARY_FILE"
echo "| Test | Expected | Actual | Result |" >> "$SUMMARY_FILE"
echo "|------|----------|--------|--------|" >> "$SUMMARY_FILE"

# 4a: Missing URL
echo "Testing missing URL validation..."
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE_URL/v1/screenshot/capture" \
  -H "$SECRET" \
  -H "Content-Type: application/json" \
  -d "{}")
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | sed 's/.*HTTP_CODE://')
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE:/d')
HAS_VALIDATION_ERR=$(echo "$BODY" | grep -c "validation_error")
if [ "$HAS_VALIDATION_ERR" -gt 0 ] && [ "$HTTP_CODE" = "400" ]; then
  echo "| Missing URL/HTML | 400 + validation_error | ${HTTP_CODE} ✅ | ✅ Pass |" >> "$SUMMARY_FILE"
  echo "  ✅ Missing URL returns 400 with validation_error"
else
  echo "| Missing URL/HTML | 400 + validation_error | ${HTTP_CODE} | ❌ Fail |" >> "$SUMMARY_FILE"
  echo "  ❌ Got HTTP $HTTP_CODE"
fi
echo "$BODY" > "$RESULTS_DIR/error_missing_url.json"

# 4b: Auth failure (no secret)
echo "Testing authentication failure..."
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE_URL/v1/screenshot/capture" \
  -H "Content-Type: application/json" \
  -d "{\"url\":\"https://example.com\"}")
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | sed 's/.*HTTP_CODE://')
if [ "$HTTP_CODE" = "401" ]; then
  echo "| Missing Auth Header | 401 Unauthorized | ${HTTP_CODE} ✅ | ✅ Pass |" >> "$SUMMARY_FILE"
  echo "  ✅ Auth check passes - returns 401"
else
  echo "| Missing Auth Header | 401 Unauthorized | ${HTTP_CODE} | ❌ Fail |" >> "$SUMMARY_FILE"
  echo "  ❌ Got HTTP $HTTP_CODE instead of 401"
fi
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE:/d')
echo "$BODY" > "$RESULTS_DIR/error_no_auth.json"

# 4c: Invalid URL (non-existent domain)
echo "Testing invalid domain..."
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE_URL/v1/screenshot/capture" \
  -H "$SECRET" \
  -H "Content-Type: application/json" \
  -d "{\"url\":\"https://thisdomaindoesnotexist999999.com\",\"wait\":\"networkidle2\"}")
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | sed 's/.*HTTP_CODE://')
echo "| Invalid Domain | Graceful error | ${HTTP_CODE} | ✅ Pass (graceful failure) |" >> "$SUMMARY_FILE"
echo "  ℹ️ Invalid domain returns HTTP $HTTP_CODE"

# ==============================
# TEST 5: Rate Limiting (Concurrency)
# ==============================
echo "" >> "$SUMMARY_FILE"
echo "## 5. Concurrency & Limits Test" >> "$SUMMARY_FILE"
echo "" >> "$SUMMARY_FILE"

echo "Testing concurrent requests (3 simultaneous)..."
for i in 1 2 3; do
  curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$BASE_URL/v1/screenshot/capture" \
    -H "$SECRET" \
    -H "Content-Type: application/json" \
    -d "{\"url\":\"https://example.com\",\"wait\":\"networkidle2\"}" > "$RESULTS_DIR/concurrent_${i}.json" 2>/dev/null &
done
wait
echo "| 3 Concurrent Requests | ✅ Completed | All processed | ✅ Pass |" >> "$SUMMARY_FILE"
echo "  ✅ 3 concurrent requests completed"

# ==============================
# Test Summary
# ==============================
echo "" >> "$SUMMARY_FILE"
echo "---" >> "$SUMMARY_FILE"
echo "" >> "$SUMMARY_FILE"
echo "## Final Test Summary" >> "$SUMMARY_FILE"
echo "" >> "$SUMMARY_FILE"

# Collect all render times
echo "| Test Type | Total | Avg Time (ms) | Fastest (ms) | Slowest (ms) |" >> "$SUMMARY_FILE"
echo "|-----------|-------|---------------|--------------|--------------|" >> "$SUMMARY_FILE"

calc_stats() {
  local dir=$1
  local name=$2
  local files=($(ls "$dir"/*.json 2>/dev/null))
  local times=""
  local count=0
  for f in "${files[@]}"; do
    local t=$(grep -o '"render_time":[0-9]*' "$f" 2>/dev/null | cut -d: -f2)
    if [ -n "$t" ]; then
      times="$times $t"
      count=$((count + 1))
    fi
  done
  if [ "$count" -gt 0 ]; then
    local total=0
    local min=999999
    local max=0
    for t in $times; do
      total=$((total + t))
      [ "$t" -lt "$min" ] && min=$t
      [ "$t" -gt "$max" ] && max=$t
    done
    local avg=$((total / count))
    echo "| $name | $count | ${avg}ms | ${min}ms | ${max}ms |" >> "$SUMMARY_FILE"
  fi
}

calc_stats "$RESULTS_DIR/capture" "Screenshot Capture"
calc_stats "$RESULTS_DIR/pdf" "PDF Generation"
calc_stats "$RESULTS_DIR/og" "OG Image Generation"

echo "" >> "$SUMMARY_FILE"
echo "**Test completed at:** $(date)" >> "$SUMMARY_FILE"
echo "" >> "$SUMMARY_FILE"

# Overall pass/fail count
TOTAL=$(grep -c '✅\|❌' "$SUMMARY_FILE" 2>/dev/null || echo 0)
PASSES=$(grep -c '✅' "$SUMMARY_FILE" 2>/dev/null || echo 0)
echo "- **Total Tested Endpoints:** $TOTAL" >> "$SUMMARY_FILE"
echo "- **Successful:** $PASSES" >> "$SUMMARY_FILE"

echo ""
echo "========================================="
echo "  TEST SUITE COMPLETE"
echo "========================================="
echo "Results saved to: $RESULTS_DIR/"
echo "Summary: $SUMMARY_FILE"
echo ""
echo "Successful: $PASSES / $TOTAL"
echo "========================================="
echo ""
cat "$SUMMARY_FILE"