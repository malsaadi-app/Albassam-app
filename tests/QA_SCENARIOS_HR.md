# QA Scenarios — HR (v1)

> Use accounts:
> - qa_admin / qa12345
> - qa_hr / qa12345
> - qa_user / qa12345
>
> Always test using QA branches only:
> - مدارس البسام الأهلية بنين — QA
> - مدارس البسام الأهلية بنات — QA

## Rules
- Record every bug with: Page, Steps, Expected, Actual, Screenshot, Severity (Blocker/High/Med/Low)
- If a bug blocks continuation, stop and report immediately.

---

## HR — Employees
1) Create employee
- As: qa_hr
- Steps: HR → الموظفين → إضافة موظف
- Data: pick QA branch, stage, job title, department
- Expected: employee saved, appears in list, profile opens

2) Edit employee
- As: qa_hr
- Steps: open an employee → تعديل → change job title/department/phone/email
- Expected: save persists, no IDs leak in UI/print

3) Employee files/documents
- As: qa_hr
- Steps: open employee → الملفات → upload PDF/JPG
- Expected: upload succeeds, file listed, download opens correct file, permissions enforced

4) Bulk edit (if available)
- As: qa_hr
- Steps: HR → bulk edit → update stage/branch/fields
- Expected: only QA employees affected

---

## HR — Requests / Workflows
5) Submit HR request
- As: qa_user
- Steps: HR → الطلبات → إنشاء طلب (leave/permission/etc)
- Expected: status = submitted/pending review, appears in list

6) Review HR request
- As: qa_hr
- Steps: open pending request → approve/forward/return
- Expected: status transitions correct, logs written, requester sees updates

7) Final approval
- As: qa_admin
- Steps: approvals/workflows → approve/reject
- Expected: final status correct + audit log

8) Negative access
- As: qa_user
- Try to open another user's request by URL id
- Expected: blocked (403/redirect), no data leak

---

## HR — Reports
9) HR dashboard stats (if present)
- As: qa_hr
- Expected: numbers exclude non-QA branches by default (if report has branch filter: QA excluded by default)

10) Export/print
- As: qa_hr
- Expected: exports/prints do not include QA branches unless explicitly selected
