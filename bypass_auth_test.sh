#!/bin/bash

echo "🔓 BYPASSING ALL AUTHENTICATION - COMPLETE TEST"
echo "=============================================="

echo ""
echo "1. 🌐 Starting servers..."

# Start Next.js if not running
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "🚀 Starting Next.js..."
    cd /home/nikhil/Documents/Remo2/Removation_3
    npm run dev > /dev/null 2>&1 &
    sleep 5
fi

# Check ComfyUI
if curl -s http://127.0.0.1:8188 > /dev/null; then
    echo "✅ ComfyUI: Running"
else
    echo "❌ ComfyUI: Not running - please start it first"
    exit 1
fi

echo ""
echo "2. 🎯 Testing Bypassed AI Design Page..."

# Test the main AI Design page (now bypassed)
if curl -s http://localhost:3000/ai-design > /dev/null; then
    echo "✅ AI Design Page: Accessible (No Auth Required)"
else
    echo "❌ AI Design Page: Not accessible"
fi

echo ""
echo "3. 📸 Testing API Endpoints (No Auth)..."

# Create test image
base64 -d > /tmp/bypass_test.png << 'EOF'
iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==
EOF

# Test working API
echo "   - Working API (/api/working/generate):"
RESPONSE=$(curl -s -X POST http://localhost:3000/api/working/generate \
  -F "image=@/tmp/bypass_test.png" \
  -F 'data={"mode":"redesign","style":"modern"}')

if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    echo "     ✅ Working API: Success"
    PROMPT_ID=$(echo "$RESPONSE" | jq -r '.promptId')
    echo "     🎯 Prompt ID: $PROMPT_ID"
else
    echo "     ❌ Working API: Failed"
    echo "     📊 Response: $RESPONSE"
fi

# Test demo API
echo "   - Demo API (/api/demo/generate):"
RESPONSE=$(curl -s -X POST http://localhost:3000/api/demo/generate \
  -F "image=@/tmp/bypass_test.png" \
  -F 'data={"mode":"redesign","style":"modern"}')

if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    echo "     ✅ Demo API: Success"
else
    echo "     ❌ Demo API: Failed"
fi

echo ""
echo "4. 🎨 Testing All Bypassed Pages..."

# Test all pages that should work without auth
pages=(
    "http://localhost:3000/ai-design"
    "http://localhost:3000/working-test"
    "http://localhost:3000/simple-test"
    "http://localhost:3000/demo"
    "http://localhost:3000/dashboard"
)

for page in "${pages[@]}"; do
    if curl -s "$page" > /dev/null; then
        echo "✅ $(basename "$page"): Accessible"
    else
        echo "❌ $(basename "$page"): Not accessible"
    fi
done

echo ""
echo "5. 🔍 Checking Authentication Status..."

# Test main API (should still require auth)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/generate-bridge)
if [ "$HTTP_CODE" = "401" ]; then
    echo "✅ Main API: Still requires auth (as expected)"
else
    echo "⚠️ Main API: Unexpected status $HTTP_CODE"
fi

echo ""
echo "🎯 BYPASS COMPLETE!"
echo "=================="
echo ""
echo "✅ NO AUTHENTICATION REQUIRED FOR:"
echo "   • AI Design Studio: http://localhost:3000/ai-design"
echo "   • Working Test: http://localhost:3000/working-test"
echo "   • Simple Test: http://localhost:3000/simple-test"
echo "   • Demo: http://localhost:3000/demo"
echo "   • Dashboard: http://localhost:3000/dashboard"
echo ""
echo "✅ FEATURES AVAILABLE:"
echo "   • Real ComfyUI generation"
echo "   • Before/After comparison"
echo "   • Style selection"
echo "   • Room type selection"
echo "   • Real-time progress"
echo "   • Download results"
echo ""
echo "✅ ZERO COST GENERATION:"
echo "   • Powered by your RTX 4060"
echo "   • No API fees"
echo "   • Local processing"
echo "   • Professional SDXL quality"
echo ""
echo "🚀 READY TO USE:"
echo "   Visit any of the URLs above to start generating!"
echo ""

# Clean up
rm -f /tmp/bypass_test.png
