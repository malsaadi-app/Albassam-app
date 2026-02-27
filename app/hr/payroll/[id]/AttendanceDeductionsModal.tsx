'use client';

import { useState, useEffect } from 'react';
import AdjustDeductionModal from './AdjustDeductionModal';

type DeductionDetail = {
  date: string;
  type: string;
  minutes: number;
  checkIn?: string;
  checkOut?: string;
};

type EmployeeDeduction = {
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  totalSalary: number;
  dailyRate: number;
  hourlyRate: number;
  lateCount: number;
  earlyLeaveCount: number;
  totalLateMinutes: number;
  totalEarlyLeaveMinutes: number;
  totalMinutes: number;
  totalHours: number;
  deductionAmount: number;
  details: DeductionDetail[];
  selected?: boolean;
};

type Props = {
  runId: string;
  year: number;
  month: number;
  onClose: () => void;
  onApply: () => void;
};

export default function AttendanceDeductionsModal({ runId, year, month, onClose, onApply }: Props) {
  const [loading, setLoading] = useState(true);
  const [deductions, setDeductions] = useState<EmployeeDeduction[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [applying, setApplying] = useState(false);
  const [editingDeduction, setEditingDeduction] = useState<EmployeeDeduction | null>(null);

  useEffect(() => {
    fetchDeductions();
  }, [year, month]);

  const fetchDeductions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hr/payroll/calculate-deductions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, month })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'حدث خطأ');
        return;
      }
      setDeductions(data.deductions.map((d: EmployeeDeduction) => ({ ...d, selected: true })));
      setSettings(data.settings);
      setSummary(data.summary);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (employeeId: string) => {
    setDeductions(deductions.map(d => 
      d.employeeId === employeeId ? { ...d, selected: !d.selected } : d
    ));
  };

  const selectAll = () => {
    setDeductions(deductions.map(d => ({ ...d, selected: true })));
  };

  const deselectAll = () => {
    setDeductions(deductions.map(d => ({ ...d, selected: false })));
  };

  const applySelected = async () => {
    const selected = deductions.filter(d => d.selected);
    if (selected.length === 0) {
      alert('لم يتم اختيار أي خصومات');
      return;
    }

    const ok = confirm(`هل أنت متأكد من تطبيق الخصومات على ${selected.length} موظف؟`);
    if (!ok) return;

    setApplying(true);
    try {
      const res = await fetch(`/api/hr/payroll/runs/${runId}/apply-deductions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deductions: selected.map(d => ({
            employeeId: d.employeeId,
            amount: d.deductionAmount
          }))
        })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'حدث خطأ');
        return;
      }
      alert('✅ تم تطبيق الخصومات بنجاح');
      onApply();
      onClose();
    } finally {
      setApplying(false);
    }
  };

  const modalStyle = {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    zIndex: 3000,
    overflowY: 'auto' as const
  };

  const contentStyle = {
    width: '100%',
    maxWidth: 1200,
    maxHeight: '90vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: 18,
    border: '1px solid rgba(255,255,255,0.25)',
    padding: 24,
    overflowY: 'auto' as const,
    color: 'white'
  };

  const num = (n: number) => (Number(n || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div style={modalStyle} onClick={onClose}>
      <div style={contentStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900 }}>📊 خصومات الحضور والانصراف المقترحة</h2>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', fontSize: 24, width: 40, height: 40, borderRadius: '50%', cursor: 'pointer' }}>×</button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>جاري التحميل...</div>
        ) : deductions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, background: 'rgba(255,255,255,0.1)', borderRadius: 12 }}>
            ✅ لا يوجد خصومات مقترحة - جميع الموظفين ملتزمون بأوقات العمل!
          </div>
        ) : (
          <>
            {/* Settings Info */}
            {settings && (
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: 12, borderRadius: 12, marginBottom: 16, fontSize: 14 }}>
                <strong>الإعدادات:</strong> دوام {settings.workStartTime} - {settings.workEndTime} | 
                مدة السماح: {settings.lateThresholdMinutes} دقيقة | 
                ساعات اليوم: {settings.workHoursPerDay} | 
                أيام العمل: {settings.workingDaysPerMonth}
              </div>
            )}

            {/* Summary */}
            {summary && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
                <div style={{ background: 'rgba(255,255,255,0.12)', padding: 14, borderRadius: 12 }}>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>إجمالي الموظفين</div>
                  <div style={{ fontSize: 24, fontWeight: 900 }}>{summary.totalEmployees}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.12)', padding: 14, borderRadius: 12 }}>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>موظفين بخصومات</div>
                  <div style={{ fontSize: 24, fontWeight: 900 }}>{summary.employeesWithDeductions}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.12)', padding: 14, borderRadius: 12 }}>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>إجمالي الخصومات</div>
                  <div style={{ fontSize: 24, fontWeight: 900 }}>{num(summary.totalDeductionAmount)} ريال</div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <button onClick={selectAll} style={{ padding: '10px 16px', borderRadius: 10, background: 'rgba(16,185,129,0.3)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', fontWeight: 700, cursor: 'pointer' }}>✅ اختيار الكل</button>
              <button onClick={deselectAll} style={{ padding: '10px 16px', borderRadius: 10, background: 'rgba(239,68,68,0.3)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', fontWeight: 700, cursor: 'pointer' }}>❌ إلغاء الكل</button>
            </div>

            {/* Deductions List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {deductions.map((d) => (
                <div key={d.employeeId} style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 14, padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 4 }}>
                        <input 
                          type="checkbox" 
                          checked={d.selected} 
                          onChange={() => toggleSelect(d.employeeId)}
                          style={{ marginLeft: 8, width: 20, height: 20, cursor: 'pointer' }}
                        />
                        {d.employeeName} ({d.employeeNumber})
                      </div>
                      <div style={{ fontSize: 14, opacity: 0.9 }}>
                        الراتب: {num(d.totalSalary)} | اليومية: {num(d.dailyRate)} | الساعة: {num(d.hourlyRate)} ريال
                      </div>
                    </div>
                    <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ fontSize: 24, fontWeight: 900, color: d.selected ? '#fbbf24' : '#94a3b8' }}>{num(d.deductionAmount)} ريال</div>
                      <div style={{ fontSize: 12, opacity: 0.8 }}>{d.totalHours} ساعة</div>
                      <button
                        onClick={() => setEditingDeduction(d)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 8,
                          background: 'rgba(59,130,246,0.3)',
                          border: '1px solid rgba(255,255,255,0.3)',
                          color: 'white',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        ✏️ تعديل
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, marginBottom: 12 }}>
                    <div style={{ background: 'rgba(239,68,68,0.2)', padding: 8, borderRadius: 8, fontSize: 13 }}>
                      🔴 تأخير: {d.lateCount} مرة ({d.totalLateMinutes} دقيقة)
                    </div>
                    <div style={{ background: 'rgba(251,191,36,0.2)', padding: 8, borderRadius: 8, fontSize: 13 }}>
                      🟡 انصراف مبكر: {d.earlyLeaveCount} مرة ({d.totalEarlyLeaveMinutes} دقيقة)
                    </div>
                  </div>

                  {/* Details */}
                  <details style={{ fontSize: 13 }}>
                    <summary style={{ cursor: 'pointer', fontWeight: 700, marginBottom: 8 }}>التفاصيل اليومية ({d.details.length})</summary>
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: 10, borderRadius: 8, maxHeight: 200, overflowY: 'auto' }}>
                      {d.details.map((detail, i) => (
                        <div key={i} style={{ padding: '6px 0', borderBottom: i < d.details.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
                          <strong>{detail.date}</strong> - {detail.type}: {detail.minutes} دقيقة
                          {detail.checkIn && ` (حضور: ${detail.checkIn})`}
                          {detail.checkOut && ` (انصراف: ${detail.checkOut})`}
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              ))}
            </div>

            {/* Footer Actions */}
            <div style={{ display: 'flex', gap: 12, marginTop: 20, borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: 20 }}>
              <button 
                onClick={applySelected} 
                disabled={applying || deductions.filter(d => d.selected).length === 0}
                style={{ 
                  flex: 1, 
                  padding: '14px 20px', 
                  borderRadius: 12, 
                  background: applying ? 'rgba(156,163,175,0.3)' : 'rgba(16,185,129,0.4)', 
                  border: '1px solid rgba(255,255,255,0.3)', 
                  color: 'white', 
                  fontSize: 16, 
                  fontWeight: 900, 
                  cursor: applying ? 'not-allowed' : 'pointer' 
                }}
              >
                {applying ? 'جاري التطبيق...' : `✅ تطبيق الخصومات (${deductions.filter(d => d.selected).length})`}
              </button>
              <button 
                onClick={onClose}
                disabled={applying}
                style={{ 
                  padding: '14px 20px', 
                  borderRadius: 12, 
                  background: 'rgba(239,68,68,0.3)', 
                  border: '1px solid rgba(255,255,255,0.3)', 
                  color: 'white', 
                  fontSize: 16, 
                  fontWeight: 900, 
                  cursor: applying ? 'not-allowed' : 'pointer' 
                }}
              >
                إلغاء
              </button>
            </div>
          </>
        )}

        {/* Adjust Deduction Modal */}
        {editingDeduction && (
          <AdjustDeductionModal
            employeeDeduction={{
              employeeId: editingDeduction.employeeId,
              employeeName: editingDeduction.employeeName,
              employeeNumber: editingDeduction.employeeNumber,
              deductionAmount: editingDeduction.deductionAmount,
              details: editingDeduction.details,
              dailyRate: editingDeduction.dailyRate,
              hourlyRate: editingDeduction.hourlyRate
            }}
            runId={runId}
            onClose={() => setEditingDeduction(null)}
            onSave={(adjustedAmount) => {
              // Update the deduction amount locally
              setDeductions(deductions.map(d => 
                d.employeeId === editingDeduction.employeeId 
                  ? { ...d, deductionAmount: adjustedAmount }
                  : d
              ));
            }}
          />
        )}
      </div>
    </div>
  );
}
