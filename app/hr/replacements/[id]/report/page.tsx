'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { COLORS } from '@/lib/colors';

type Replacement = {
  id: number;
  requestNumber: string;
  position: {
    title: string;
    code: string;
    department: string;
  };
  currentEmployee: {
    fullNameAr: string;
    employeeNumber: string;
  };
  newEmployee: {
    fullNameAr: string;
    employeeNumber: string;
  };
};

export default function ReplacementReportPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [replacement, setReplacement] = useState<Replacement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const [reportPeriod, setReportPeriod] = useState('WEEK_1');
  const [currentEmployeeScore, setCurrentEmployeeScore] = useState('');
  const [newEmployeeScore, setNewEmployeeScore] = useState('');
  const [currentEmployeeNotes, setCurrentEmployeeNotes] = useState('');
  const [newEmployeeNotes, setNewEmployeeNotes] = useState('');
  const [comparisonNotes, setComparisonNotes] = useState('');
  const [recommendation, setRecommendation] = useState('CONTINUE');

  useEffect(() => {
    fetchReplacement();
  }, [id]);

  const fetchReplacement = async () => {
    try {
      const res = await fetch(`/api/hr/replacements/${id}`);
      const data = await res.json();
      
      if (res.ok) {
        setReplacement(data.replacement);
      } else {
        setError(data.error || 'حدث خطأ');
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch(`/api/hr/replacements/${id}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportPeriod,
          currentEmployeeScore: currentEmployeeScore ? Number(currentEmployeeScore) : null,
          currentEmployeeNotes,
          newEmployeeScore: newEmployeeScore ? Number(newEmployeeScore) : null,
          newEmployeeNotes,
          comparisonNotes,
          recommendation: recommendation || null
        })
      });

      const data = await res.json();
      if (res.ok) {
        router.push(`/hr/replacements/${id}?success=report`);
      } else {
        setError(data.error || 'حدث خطأ');
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: `4px solid ${COLORS.gray200}`,
          borderTop: `4px solid ${COLORS.primary}`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error && !replacement) {
    return (
      <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '2rem' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{
            background: COLORS.dangerLighter,
            border: `1px solid ${COLORS.dangerLight}`,
            borderRadius: '12px',
            padding: '1.5rem',
            color: COLORS.dangerText,
            textAlign: 'center',
            fontWeight: '600'
          }}>
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!replacement) return null;

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: '#F9FAFB' }}>
      {/* Header */}
      <div style={{
        background: 'white',
        borderBottom: `1px solid ${COLORS.gray200}`,
        position: 'sticky',
        top: 0,
        zIndex: 40
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem 1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: COLORS.gray900, marginBottom: '0.25rem' }}>
                إضافة تقرير أداء
              </h1>
              <p style={{ fontSize: '0.875rem', color: COLORS.gray600 }}>
                {replacement.requestNumber} • {replacement.position.title} ({replacement.position.code})
              </p>
            </div>
            <Link
              href={`/hr/replacements/${id}`}
              style={{
                background: 'white',
                color: COLORS.gray900,
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                border: `1px solid ${COLORS.gray200}`,
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '0.875rem'
              }}
            >
              ← الرجوع
            </Link>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1rem' }}>
        {error && (
          <div style={{
            background: COLORS.dangerLighter,
            border: `1px solid ${COLORS.dangerLight}`,
            borderRadius: '0.75rem',
            padding: '1rem',
            marginBottom: '1.5rem',
            color: COLORS.dangerText,
            fontWeight: '600'
          }}>
            ❌ {error}
          </div>
        )}

        <div style={{
          background: 'white',
          border: `1px solid ${COLORS.gray200}`,
          borderRadius: '0.75rem',
          padding: '2rem'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: COLORS.gray900, marginBottom: '1rem' }}>
            مقارنة: الحالي ↔ الجديد
          </h2>
          <p style={{ fontSize: '0.875rem', color: COLORS.gray600, marginBottom: '2rem' }}>
            {replacement.currentEmployee.fullNameAr} ({replacement.currentEmployee.employeeNumber})
            {' '}↔{' '}
            {replacement.newEmployee.fullNameAr} ({replacement.newEmployee.employeeNumber})
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: COLORS.gray900, marginBottom: '0.5rem' }}>
                الفترة *
              </label>
              <select
                value={reportPeriod}
                onChange={(e) => setReportPeriod(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `1px solid ${COLORS.gray200}`,
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem'
                }}
              >
                <option value="WEEK_1">WEEK_1</option>
                <option value="WEEK_2">WEEK_2</option>
                <option value="MONTH_1">MONTH_1</option>
                <option value="MONTH_2">MONTH_2</option>
                <option value="FINAL">FINAL</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: COLORS.gray900, marginBottom: '0.5rem' }}>
                  درجة الموظف الحالي (1-10)
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={currentEmployeeScore}
                  onChange={(e) => setCurrentEmployeeScore(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${COLORS.gray200}`,
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: COLORS.gray900, marginBottom: '0.5rem' }}>
                  درجة الموظف الجديد (1-10)
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={newEmployeeScore}
                  onChange={(e) => setNewEmployeeScore(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${COLORS.gray200}`,
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: COLORS.gray900, marginBottom: '0.5rem' }}>
                ملاحظات على الموظف الحالي
              </label>
              <textarea
                rows={3}
                value={currentEmployeeNotes}
                onChange={(e) => setCurrentEmployeeNotes(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `1px solid ${COLORS.gray200}`,
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: COLORS.gray900, marginBottom: '0.5rem' }}>
                ملاحظات على الموظف الجديد
              </label>
              <textarea
                rows={3}
                value={newEmployeeNotes}
                onChange={(e) => setNewEmployeeNotes(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `1px solid ${COLORS.gray200}`,
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: COLORS.gray900, marginBottom: '0.5rem' }}>
                مقارنة وتوصية
              </label>
              <textarea
                rows={4}
                value={comparisonNotes}
                onChange={(e) => setComparisonNotes(e.target.value)}
                placeholder="اكتب المقارنة بين الأداء..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `1px solid ${COLORS.gray200}`,
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: COLORS.gray900, marginBottom: '0.5rem' }}>
                التوصية
              </label>
              <select
                value={recommendation}
                onChange={(e) => setRecommendation(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `1px solid ${COLORS.gray200}`,
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem'
                }}
              >
                <option value="CONTINUE">CONTINUE</option>
                <option value="CONFIRM_NEW">CONFIRM_NEW</option>
                <option value="CANCEL">CANCEL</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '1rem', paddingTop: '1rem' }}>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  background: submitting ? COLORS.gray300 : COLORS.success,
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '0.875rem'
                }}
              >
                {submitting ? 'جاري الحفظ...' : '✅ حفظ التقرير'}
              </button>
              <Link
                href={`/hr/replacements/${id}`}
                style={{
                  background: 'white',
                  color: COLORS.gray900,
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: `1px solid ${COLORS.gray200}`,
                  textDecoration: 'none',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                إلغاء
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
