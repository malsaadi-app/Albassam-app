'use client';

import { useState } from 'react';

type DeductionDetail = {
  date: string;
  type: string;
  minutes: number;
  checkIn?: string;
  checkOut?: string;
  ignored?: boolean;
};

type Props = {
  employeeDeduction: {
    employeeId: string;
    employeeName: string;
    employeeNumber: string;
    deductionAmount: number;
    details: DeductionDetail[];
    dailyRate: number;
    hourlyRate: number;
  };
  runId: string;
  onClose: () => void;
  onSave: (adjustedAmount: number) => void;
};

export default function AdjustDeductionModal({ employeeDeduction, runId, onClose, onSave }: Props) {
  const [details, setDetails] = useState<DeductionDetail[]>(
    employeeDeduction.details.map(d => ({ ...d, ignored: false }))
  );
  const [manualAmount, setManualAmount] = useState<number>(employeeDeduction.deductionAmount);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const toggleIgnore = (index: number) => {
    const newDetails = [...details];
    newDetails[index].ignored = !newDetails[index].ignored;
    setDetails(newDetails);

    // Recalculate amount based on non-ignored details
    const minuteRate = employeeDeduction.hourlyRate / 60;
    const totalMinutes = newDetails
      .filter(d => !d.ignored)
      .reduce((sum, d) => sum + d.minutes, 0);
    const calculatedAmount = totalMinutes * minuteRate;
    setManualAmount(Math.round(calculatedAmount * 100) / 100);
  };

  const handleSave = async () => {
    if (manualAmount < 0) {
      alert('المبلغ لا يمكن أن يكون سالب');
      return;
    }

    setSaving(true);
    try {
      const ignoredDetails = details
        .map((d, i) => (d.ignored ? i : null))
        .filter(i => i !== null);

      const res = await fetch(`/api/hr/payroll/runs/${runId}/adjust-deduction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: employeeDeduction.employeeId,
          originalAmount: employeeDeduction.deductionAmount,
          adjustedAmount: manualAmount,
          ignoredDetails: ignoredDetails.length > 0 ? ignoredDetails : null,
          adjustmentReason: reason || null
        })
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'حدث خطأ');
        return;
      }

      alert('✅ تم حفظ التعديل بنجاح');
      onSave(manualAmount);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const modalStyle = {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(0,0,0,0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    zIndex: 4000
  };

  const contentStyle = {
    width: '100%',
    maxWidth: 700,
    maxHeight: '90vh',
    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
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
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>✏️ تعديل خصم: {employeeDeduction.employeeName}</h3>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', fontSize: 24, width: 40, height: 40, borderRadius: '50%', cursor: 'pointer' }}>×</button>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.15)', padding: 12, borderRadius: 12, marginBottom: 16, fontSize: 14 }}>
          <strong>الخصم الأصلي:</strong> {num(employeeDeduction.deductionAmount)} ريال
        </div>

        {/* Daily Details */}
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ fontSize: 16, fontWeight: 900, marginBottom: 10 }}>📅 التفاصيل اليومية ({details.length}):</h4>
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 12, maxHeight: 250, overflowY: 'auto' }}>
            {details.map((detail, i) => (
              <label
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px',
                  marginBottom: 8,
                  background: detail.ignored ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.1)',
                  borderRadius: 10,
                  cursor: 'pointer',
                  opacity: detail.ignored ? 0.5 : 1,
                  textDecoration: detail.ignored ? 'line-through' : 'none'
                }}
              >
                <input
                  type="checkbox"
                  checked={detail.ignored}
                  onChange={() => toggleIgnore(i)}
                  style={{ width: 20, height: 20, cursor: 'pointer' }}
                />
                <div style={{ flex: 1, fontSize: 13 }}>
                  <strong>{detail.date}</strong> - {detail.type}: {detail.minutes} دقيقة
                  {detail.checkIn && ` (حضور: ${detail.checkIn})`}
                  {detail.checkOut && ` (انصراف: ${detail.checkOut})`}
                </div>
              </label>
            ))}
          </div>
          <div style={{ fontSize: 12, opacity: 0.8, marginTop: 8 }}>
            💡 ضع علامة ✓ على التفاصيل التي تريد تجاهلها
          </div>
        </div>

        {/* Manual Amount */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 700, marginBottom: 6 }}>
            💰 قيمة الخصم النهائية (ريال):
          </label>
          <input
            type="number"
            value={manualAmount}
            onChange={(e) => setManualAmount(Number(e.target.value))}
            step={0.01}
            min={0}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.3)',
              background: 'rgba(255,255,255,0.15)',
              color: 'white',
              fontSize: 18,
              fontWeight: 900
            }}
          />
          <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
            يمكنك تعديل المبلغ يدوياً إذا لزم الأمر
          </div>
        </div>

        {/* Reason */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 700, marginBottom: 6 }}>
            📝 سبب التعديل (اختياري):
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="مثال: تم العفو عن التأخير بسبب ظرف خاص..."
            rows={3}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.3)',
              background: 'rgba(255,255,255,0.15)',
              color: 'white',
              fontSize: 14,
              resize: 'vertical' as const
            }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 1,
              padding: '14px 20px',
              borderRadius: 12,
              background: saving ? 'rgba(156,163,175,0.3)' : 'rgba(16,185,129,0.5)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: 'white',
              fontSize: 16,
              fontWeight: 900,
              cursor: saving ? 'not-allowed' : 'pointer'
            }}
          >
            {saving ? 'جاري الحفظ...' : '✅ حفظ التعديل'}
          </button>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              padding: '14px 20px',
              borderRadius: 12,
              background: 'rgba(239,68,68,0.4)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: 'white',
              fontSize: 16,
              fontWeight: 900,
              cursor: saving ? 'not-allowed' : 'pointer'
            }}
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}
