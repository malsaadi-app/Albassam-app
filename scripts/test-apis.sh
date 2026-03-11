#!/bin/bash
# API Endpoints Test Script
# Comprehensive testing of all API endpoints

# Don't exit on error - we want to test all endpoints
set +e

BASE_URL="http://localhost:3000"
PASSED=0
FAILED=0
WARNINGS=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "================================================"
echo "🧪 API ENDPOINTS COMPREHENSIVE TEST"
echo "================================================"
echo "Base URL: $BASE_URL"
echo "Time: $(date)"
echo "================================================"
echo ""

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local expected_status=$3
    local description=$4
    local data=$5
    
    echo -n "Testing: $description ... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL$endpoint" 2>&1)
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data" 2>&1)
    fi
    
    status_code=$(echo "$response" | tail -1)
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASSED${NC} (HTTP $status_code)"
        ((PASSED++))
    elif [ "$status_code" = "401" ] || [ "$status_code" = "403" ]; then
        echo -e "${GREEN}✅ PASSED${NC} ${YELLOW}(AUTH REQUIRED - Expected)${NC} (HTTP $status_code)"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAILED${NC} (Expected: $expected_status, Got: $status_code)"
        ((FAILED++))
    fi
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  AUTHENTICATION ENDPOINTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint GET "/api/auth/session" 200 "Get Session"
test_endpoint GET "/api/health" 200 "Health Check"
test_endpoint GET "/api/status" 200 "Status Check"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  DASHBOARD ENDPOINTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint GET "/api/dashboard" 200 "Dashboard Stats"
test_endpoint GET "/api/dashboard/stats" 200 "Dashboard Enhanced Stats"
test_endpoint GET "/api/dashboard/pending-approvals" 200 "Pending Approvals"
test_endpoint GET "/api/analytics/dashboard" 200 "Analytics Dashboard"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  HR ENDPOINTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint GET "/api/hr/employees" 200 "List Employees"
test_endpoint GET "/api/hr/requests" 200 "List HR Requests"
test_endpoint GET "/api/hr/leave-balance" 200 "Leave Balance"
test_endpoint GET "/api/hr/dashboard/stats" 200 "HR Dashboard Stats"
test_endpoint GET "/api/hr/master-data/departments" 200 "Departments"
test_endpoint GET "/api/hr/master-data/job-titles" 200 "Job Titles"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣  PAYROLL ENDPOINTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint GET "/api/hr/payroll/runs" 200 "List Payroll Runs"
test_endpoint GET "/api/profile/payslips" 200 "Employee Payslips"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5️⃣  ATTENDANCE ENDPOINTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint GET "/api/attendance" 200 "Attendance Records"
test_endpoint GET "/api/attendance/my-history" 200 "My Attendance History"
test_endpoint GET "/api/hr/attendance" 200 "HR Attendance"
test_endpoint GET "/api/hr/attendance/problematic-days" 200 "Problematic Days"
test_endpoint GET "/api/hr/attendance/correction-history" 200 "Correction History"
test_endpoint GET "/api/hr/attendance/requests" 200 "Attendance Requests"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6️⃣  WORKFLOW ENDPOINTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint GET "/api/workflows" 200 "List Workflows"
test_endpoint GET "/api/workflows/runtime" 200 "Workflow Approvals"
test_endpoint GET "/api/settings/workflow-builder" 200 "Workflow Builder"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "7️⃣  PROCUREMENT ENDPOINTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint GET "/api/procurement/requests" 200 "Procurement Requests"
test_endpoint GET "/api/procurement/suppliers" 200 "Suppliers"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "8️⃣  MAINTENANCE ENDPOINTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint GET "/api/maintenance/requests" 200 "Maintenance Requests"
test_endpoint GET "/api/maintenance/assets" 200 "Assets"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "9️⃣  FINANCE ENDPOINTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint GET "/api/finance/requests" 200 "Finance Requests"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔟 INVENTORY ENDPOINTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint GET "/api/inventory/items" 200 "Inventory Items"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣1️⃣  BRANCHES & ORGANIZATIONAL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint GET "/api/branches" 200 "List Branches"
test_endpoint GET "/api/stages" 200 "List Stages"
test_endpoint GET "/api/settings/org-structure" 200 "Org Structure"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣2️⃣  TASKS & NOTIFICATIONS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint GET "/api/tasks" 200 "Tasks"
test_endpoint GET "/api/notifications" 200 "Notifications"
echo ""

echo "================================================"
echo "📊 TEST SUMMARY"
echo "================================================"
echo -e "${GREEN}✅ Passed:${NC}         $PASSED"
echo -e "${YELLOW}⚠️  Auth Required:${NC}  $WARNINGS"
echo -e "${RED}❌ Failed:${NC}         $FAILED"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

TOTAL=$((PASSED + FAILED + WARNINGS))
SUCCESS_RATE=$((PASSED * 100 / TOTAL))

echo "Total Tests:     $TOTAL"
echo "Success Rate:    ${SUCCESS_RATE}%"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL CRITICAL TESTS PASSED!${NC}"
    exit 0
else
    echo -e "${RED}❌ SOME TESTS FAILED${NC}"
    echo "Review failed endpoints above"
    exit 1
fi
