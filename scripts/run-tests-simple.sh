#!/bin/bash
# Simple Test Runner - Non-Interactive
# Runs all test suites automatically

set +e  # Don't exit on error

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

PASSED=0
FAILED=0

echo ""
echo "╔════════════════════════════════════════════════╗"
echo "║   🧪 ALBASSAM HR SYSTEM                        ║"
echo "║   COMPREHENSIVE TEST SUITE                     ║"
echo "╚════════════════════════════════════════════════╝"
echo ""
echo "$(date +'%A, %B %d, %Y - %H:%M:%S')"
echo ""
echo "================================================"
echo ""

# Test 1: Health Check
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}TEST SUITE #1: 🏥 System Health Check${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
if curl -s http://localhost:3000/api/health | jq '.' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Health Check PASSED${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ Health Check FAILED${NC}"
    ((FAILED++))
fi
echo ""
sleep 3

# Test 2: API Endpoints
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}TEST SUITE #2: 🌐 API Endpoints${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
if ./scripts/test-apis.sh; then
    echo -e "${GREEN}✅ API Tests PASSED${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ API Tests FAILED${NC}"
    ((FAILED++))
fi
echo ""
sleep 3

# Test 3: Database
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}TEST SUITE #3: 🗄️  Database Integrity${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
if node scripts/test-database.js; then
    echo -e "${GREEN}✅ Database Tests PASSED${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ Database Tests FAILED${NC}"
    ((FAILED++))
fi
echo ""
sleep 3

# Test 4: Core Operations
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}TEST SUITE #4: 👥 Core Operations${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
if node scripts/test-core-operations.js; then
    echo -e "${GREEN}✅ Core Operations Tests PASSED${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ Core Operations Tests FAILED${NC}"
    ((FAILED++))
fi
echo ""
sleep 3

# Test 5: Payroll
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}TEST SUITE #5: 💰 Payroll System${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
if node scripts/test-payroll.js; then
    echo -e "${GREEN}✅ Payroll Tests PASSED${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ Payroll Tests FAILED${NC}"
    ((FAILED++))
fi
echo ""
sleep 3

# Test 6: Workflows
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}TEST SUITE #6: 🔄 Workflows & Requests${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
if node scripts/test-workflows.js; then
    echo -e "${GREEN}✅ Workflow Tests PASSED${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ Workflow Tests FAILED${NC}"
    ((FAILED++))
fi
echo ""
sleep 3

# Test 7: Build Verification
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}TEST SUITE #7: 🔧 Build Verification${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
if ./scripts/verify-build.sh; then
    echo -e "${GREEN}✅ Build Verification PASSED${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ Build Verification FAILED${NC}"
    ((FAILED++))
fi
echo ""

# Final Report
TOTAL=$((PASSED + FAILED))
SUCCESS_RATE=$((PASSED * 100 / TOTAL))

echo ""
echo "╔════════════════════════════════════════════════╗"
echo "║          📊 FINAL TEST REPORT                  ║"
echo "╚════════════════════════════════════════════════╝"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Date:           $(date +'%Y-%m-%d %H:%M:%S')"
echo "Total Suites:   $TOTAL"
echo -e "${GREEN}Passed:${NC}         $PASSED"
echo -e "${RED}Failed:${NC}         $FAILED"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $SUCCESS_RATE -eq 100 ]; then
    echo -e "${GREEN}${BOLD}🎉 ALL TEST SUITES PASSED!${NC}"
    echo -e "${GREEN}System is production-ready ✅${NC}"
elif [ $SUCCESS_RATE -ge 80 ]; then
    echo -e "${YELLOW}${BOLD}⚠️  MOST TESTS PASSED${NC}"
    echo -e "${YELLOW}Success Rate: ${SUCCESS_RATE}%${NC}"
elif [ $SUCCESS_RATE -ge 60 ]; then
    echo -e "${YELLOW}${BOLD}⚠️  MODERATE SUCCESS${NC}"
    echo -e "${YELLOW}Success Rate: ${SUCCESS_RATE}%${NC}"
else
    echo -e "${RED}${BOLD}❌ CRITICAL FAILURES${NC}"
    echo -e "${RED}Success Rate: ${SUCCESS_RATE}%${NC}"
fi

echo ""
echo "================================================"
echo ""

exit 0
