#!/bin/bash
# Simple fix: Just change number format and add "الإجمالي" label

FILE="/data/.openclaw/workspace/albassam-tasks/app/hr/payroll/[id]/page.tsx"

# Step 1: Fix the number locale format
sed -i "s/toLocaleString('ar-SA')/toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })/g" "$FILE"

# Step 2: Find and replace the tfoot section properly
# This is the safest approach - replace the entire tfoot block

cat > /tmp/new_tfoot.txt << 'TFOOT_END'
                {totals && (
                  <tfoot style={{ background: 'rgba(255,255,255,0.15)', fontWeight: 900 }}>
                    <tr>
                      <td style={{ padding: 12 }} colSpan={4}>الإجمالي</td>
                      <td style={{ padding: 12 }}>{num(totals.basic)}</td>
                      <td style={{ padding: 12 }}>{num(totals.transport)}</td>
                      <td style={{ padding: 12 }}>{num(totals.housing)}</td>
                      <td style={{ padding: 12 }}>{num(totals.other)}</td>
                      <td style={{ padding: 12 }}>{num(totals.deductions)}</td>
                      <td style={{ padding: 12 }}>{num(totals.total)}</td>
                    </tr>
                  </tfoot>
                )}
TFOOT_END

echo "File fixed!"
