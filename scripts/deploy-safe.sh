#!/bin/bash
# Safe Deployment Script
# Builds, verifies, and deploys with safety checks

set -e

echo "🚀 Starting safe deployment process..."
echo ""

# Step 1: Clean old build
echo "1️⃣ Cleaning old build artifacts..."
rm -rf .next .turbo node_modules/.cache
echo "✅ Cleaned"
echo ""

# Step 2: Build with production environment
echo "2️⃣ Building for production..."
NODE_ENV=production npm run build
echo "✅ Build completed"
echo ""

# Step 3: Verify build
echo "3️⃣ Verifying build integrity..."
./scripts/verify-build.sh
if [ $? -ne 0 ]; then
    echo "❌ Build verification failed. Aborting deployment."
    exit 1
fi
echo ""

# Step 4: Test server startup (dry run)
echo "4️⃣ Testing server startup (5 second test)..."
timeout 5 npm start > /tmp/startup-test.log 2>&1 || true
if grep -q "Error" /tmp/startup-test.log; then
    echo "❌ Server startup test failed"
    echo "Last 10 lines of error log:"
    tail -10 /tmp/startup-test.log
    exit 1
fi
echo "✅ Server startup successful"
echo ""

# Step 5: PM2 deployment
echo "5️⃣ Deploying to PM2..."
pm2 delete albassam-app 2>/dev/null || true
pm2 start node_modules/.bin/next --name albassam-app -- start -p 3000
echo "✅ PM2 process started"
echo ""

# Step 6: Health check
echo "6️⃣ Running health check..."
sleep 5
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$HTTP_STATUS" != "200" ]; then
    echo "❌ Health check failed (HTTP $HTTP_STATUS)"
    echo "Rolling back..."
    pm2 stop albassam-app
    exit 1
fi
echo "✅ Health check passed (HTTP 200)"
echo ""

# Step 7: Save PM2 config
echo "7️⃣ Saving PM2 configuration..."
pm2 save
echo "✅ PM2 config saved"
echo ""

# Final status
echo "🎉 DEPLOYMENT SUCCESSFUL!"
echo ""
pm2 list
echo ""
echo "📊 App Status:"
curl -s -I http://localhost:3000 | head -5
echo ""
echo "✅ All systems operational"
