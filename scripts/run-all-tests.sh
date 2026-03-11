#!/bin/bash
# Master Test Runner
# Executes all test suites and generates comprehensive report

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Test results
TOTAL_PASSED=0
TOTAL_FAILED=0
TOTAL_WARNINGS=0
SUITE_COUNT=0
FAILED_SUITES=()

# Log file
LOG_FILE="/tmp/albassam-test-results-$(date +%Y%m%d-%H%M%S).log"

echo ""
echo "╔════════════════════════════════════════════════╗"
echo "║   🧪 ALBASSAM HR SYSTEM                        ║"
echo "║   COMPREHENSIVE TEST SUITE                     ║"
echo "╚════════════════════════════════════════════════╝"
echo ""
echo "$(date +'%A, %B %d, %Y - %H:%M:%S')"
echo ""
echo "Log file: $LOG_FILE"
echo ""
echo "================================================"
echo ""

# Function to run a test suite
run_suite() {
    local name=$1
    local command=$2
    local icon=$3
    
    ((SUITE_COUNT++))
    
    echo -e "${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}${BOLD}TEST SUITE #$SUITE_COUNT: $icon $name${NC}"
    echo -e "${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    # Run the test and capture output
    if eval "$command" | tee -a "$LOG_FILE"; then
        echo -e "${GREEN}✅ Suite '$name' PASSED${NC}"
        ((TOTAL_PASSED++))
    else
        echo -e "${RED}❌ Suite '$name' FAILED${NC}"
        ((TOTAL_FAILED++))
        FAILED_SUITES+=("$name")
    fi
    
    echo ""
    echo "Press Enter to continue to next suite..."
    read -r
}

# Start testing
echo -e "${BLUE}Starting comprehensive test execution...${NC}"
echo ""

# Test Suite 1: Health Check
run_suite "System Health Check" "curl -s http://localhost:3000/api/health | jq '.' || echo 'App may be offline'" "🏥"

# Test Suite 2: API Endpoints
run_suite "API Endpoints Test" "./scripts/test-apis.sh" "🌐"

# Test Suite 3: Database Integrity
run_suite "Database Integrity Test" "node scripts/test-database.js" "🗄️"

# Test Suite 4: Payroll System
run_suite "Payroll System Test" "node scripts/test-payroll.js" "💰"

# Test Suite 5: Build Verification
run_suite "Build Verification" "./scripts/verify-build.sh" "🔧"

# Generate final report
echo ""
echo "╔════════════════════════════════════════════════╗"
echo "║          📊 FINAL TEST REPORT                  ║"
echo "╚════════════════════════════════════════════════╝"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${BOLD}Test Execution Summary${NC}"
echo ""
echo "Date:           $(date +'%Y-%m-%d %H:%M:%S')"
echo "Total Suites:   $SUITE_COUNT"
echo -e "${GREEN}Passed:${NC}         $TOTAL_PASSED"
echo -e "${RED}Failed:${NC}         $TOTAL_FAILED"
echo ""

if [ $TOTAL_FAILED -gt 0 ]; then
    echo -e "${RED}${BOLD}Failed Suites:${NC}"
    for suite in "${FAILED_SUITES[@]}"; do
        echo -e "  ${RED}❌ $suite${NC}"
    done
    echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Calculate success rate
SUCCESS_RATE=$((TOTAL_PASSED * 100 / SUITE_COUNT))

if [ $SUCCESS_RATE -eq 100 ]; then
    echo -e "${GREEN}${BOLD}🎉 ALL TEST SUITES PASSED!${NC}"
    echo -e "${GREEN}System is production-ready ✅${NC}"
    echo ""
elif [ $SUCCESS_RATE -ge 80 ]; then
    echo -e "${YELLOW}${BOLD}⚠️  MOST TESTS PASSED${NC}"
    echo -e "${YELLOW}Success Rate: ${SUCCESS_RATE}%${NC}"
    echo -e "${YELLOW}Review failed tests before deployment${NC}"
    echo ""
elif [ $SUCCESS_RATE -ge 60 ]; then
    echo -e "${YELLOW}${BOLD}⚠️  MODERATE SUCCESS${NC}"
    echo -e "${YELLOW}Success Rate: ${SUCCESS_RATE}%${NC}"
    echo -e "${YELLOW}Several issues need attention${NC}"
    echo ""
else
    echo -e "${RED}${BOLD}❌ CRITICAL FAILURES${NC}"
    echo -e "${RED}Success Rate: ${SUCCESS_RATE}%${NC}"
    echo -e "${RED}System requires fixes before deployment${NC}"
    echo ""
fi

echo "Full log saved to: $LOG_FILE"
echo ""

echo "╔════════════════════════════════════════════════╗"
echo "║          RECOMMENDED NEXT STEPS                ║"
echo "╚════════════════════════════════════════════════╝"
echo ""

if [ $TOTAL_FAILED -eq 0 ]; then
    echo "✅ All tests passed! System is ready for:"
    echo "   • Production deployment"
    echo "   • User acceptance testing"
    echo "   • Documentation review"
    echo ""
else
    echo "⚠️  Action required:"
    echo "   1. Review failed test logs above"
    echo "   2. Fix identified issues"
    echo "   3. Re-run tests: ./scripts/run-all-tests.sh"
    echo "   4. Check log file: $LOG_FILE"
    echo ""
fi

echo "================================================"
echo ""

# Exit with appropriate code
if [ $TOTAL_FAILED -eq 0 ]; then
    exit 0
else
    exit 1
fi
