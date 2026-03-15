#!/bin/bash
# Albassam Platform - iOS Info.plist Fix & Build Script
# Run this on Mac with Flutter installed

echo "🍎 Albassam Platform - iOS Fix & Build"
echo "======================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check Flutter
echo "📋 Step 1: Checking Flutter..."
if ! command -v flutter &> /dev/null; then
    echo -e "${RED}❌ Flutter not found! Please install Flutter first.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Flutter found: $(flutter --version | head -1)${NC}"
echo ""

# Step 2: Navigate to project
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"
echo "📂 Working directory: $SCRIPT_DIR"
echo ""

# Step 3: Clean previous build
echo "🧹 Step 2: Cleaning previous build..."
flutter clean
rm -rf ios/Pods ios/Podfile.lock ios/.symlinks ios/build
echo -e "${GREEN}✅ Clean complete${NC}"
echo ""

# Step 4: Regenerate iOS project if needed
if [ ! -d "ios/Runner" ]; then
    echo "🔨 Step 3: Regenerating iOS project structure..."
    flutter create .
    echo -e "${GREEN}✅ iOS project regenerated${NC}"
    echo ""
fi

# Step 5: Copy Info.plist
echo "📄 Step 4: Copying Info.plist..."
if [ -f "ios-Info.plist.template" ]; then
    mkdir -p ios/Runner
    cp ios-Info.plist.template ios/Runner/Info.plist
    echo -e "${GREEN}✅ Info.plist copied successfully${NC}"
    ls -lh ios/Runner/Info.plist
else
    echo -e "${RED}❌ Template not found: ios-Info.plist.template${NC}"
    exit 1
fi
echo ""

# Step 6: Get dependencies
echo "📦 Step 5: Getting Flutter dependencies..."
flutter pub get
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Step 7: Install CocoaPods
echo "🔧 Step 6: Installing CocoaPods dependencies..."
cd ios
pod install
cd ..
echo -e "${GREEN}✅ CocoaPods installed${NC}"
echo ""

# Step 8: Build iOS
echo "🏗️  Step 7: Building iOS app (this takes 5-10 minutes)..."
flutter build ios --release
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful!${NC}"
else
    echo -e "${RED}❌ Build failed. Check errors above.${NC}"
    exit 1
fi
echo ""

# Step 9: Open Xcode
echo "📦 Step 8: Opening Xcode for Archive..."
echo -e "${YELLOW}Next steps in Xcode:${NC}"
echo "  1. Select 'Any iOS Device (arm64)' at the top"
echo "  2. Product → Archive"
echo "  3. Distribute App → App Store Connect → Upload"
echo ""
open ios/Runner.xcworkspace

echo ""
echo -e "${GREEN}🎉 Script complete!${NC}"
echo ""
echo "⏱️  Total time: Build took ~5-10 minutes"
echo "📱 Next: Archive in Xcode, then upload to App Store Connect"
echo ""
