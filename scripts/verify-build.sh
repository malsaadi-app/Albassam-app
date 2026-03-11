#!/bin/bash
# Build Verification Script
# Ensures production build is complete before deployment

set -e

echo "🔍 Verifying production build..."

# Check if .next directory exists
if [ ! -d ".next" ]; then
    echo "❌ ERROR: .next directory not found"
    echo "Run 'npm run build' first"
    exit 1
fi

# Required files for Next.js production
REQUIRED_FILES=(
    ".next/routes-manifest.json"
    ".next/prerender-manifest.json"
    ".next/build-manifest.json"
    ".next/app-build-manifest.json"
    ".next/required-server-files.json"
    ".next/package.json"
)

# Check each required file
MISSING_FILES=0
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Missing: $file"
        MISSING_FILES=$((MISSING_FILES + 1))
    else
        SIZE=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
        if [ "$SIZE" -lt 100 ]; then
            echo "⚠️  Warning: $file is too small ($SIZE bytes)"
            MISSING_FILES=$((MISSING_FILES + 1))
        else
            echo "✅ Found: $file ($SIZE bytes)"
        fi
    fi
done

# Check standalone directory
if [ ! -d ".next/standalone" ]; then
    echo "⚠️  Warning: .next/standalone directory not found"
    echo "Make sure 'output: standalone' is set in next.config.ts"
fi

# Verify build manifest has pages
PAGES_COUNT=$(grep -o '"pages":{' .next/build-manifest.json 2>/dev/null | wc -l)
if [ "$PAGES_COUNT" -lt 1 ]; then
    echo "❌ ERROR: build-manifest.json has no pages"
    MISSING_FILES=$((MISSING_FILES + 1))
fi

# Final verdict
echo ""
if [ $MISSING_FILES -gt 0 ]; then
    echo "❌ Build verification FAILED"
    echo "Missing or invalid files: $MISSING_FILES"
    echo ""
    echo "🔧 To fix:"
    echo "1. Run: rm -rf .next"
    echo "2. Run: NODE_ENV=production npm run build"
    echo "3. Run this script again"
    exit 1
else
    echo "✅ Build verification PASSED"
    echo "Production build is complete and ready to deploy"
    exit 0
fi
