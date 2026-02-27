'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { COLORS } from '@/lib/colors';

type User = { id: string; displayName: string; username: string; role: string };
type Delegation = {
  id: string;
  delegateToUserId: string;
  createdByUserId: string;
  startAt: string;
  endAt: string;
  active: boolean;
  createdAt: string;
  delegateTo: { id: string; displayName: string; username: string };
  createdBy: { id: string; displayName: string; username: string };
};

export default function DelegationsPage() {
  const router = useRouter();
  const [meRole, setMeRole] = useState<string>('');
  const [users, setUsers] = useState<User[]>([]);
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [delegateToUserId, setDelegateToUserId] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          router.push('/');
          return;
        }
        const data = await res.json();
        setMeRole(data.user.role);

        if (data.user.role !== 'ADMIN') {
          setLoading(false);
          return;
        }

        await Promise.all([fetchUsers(), fetchDelegations()]);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUsers = async () => {
    const res = await fetch('/api/admin/users');
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users || []);
    }
  };

  const fetchDelegations = async () => {
    const res = await fetch('/api/admin/delegations');
    if (res.ok) {
      const data = await res.json();
      setDelegations(data.delegations || []);
    }
  };

  const canSubmit = useMemo(() => {
    return delegateToUserId && startAt && endAt;
  }, [delegateToUserId, startAt, endAt]);

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/delegations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delegateToUserId, startAt, endAt, active: true })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'حدث خطأ');
        return;
      }
      alert('تم إنشاء التفويض ✅');
      setDelegateToUserId('');
      setStartAt('');
      setEndAt('');
      await fetchDelegations();
    } finally {
      setSubmitting(false);
    }
  };

  const cancelDelegation = async (id: string) => {
    if (!confirm('إلغاء التفويض الآن؟')) return;
    const res = await fetch(`/api/admin/delegations/${id}`, { method: 'PATCH' });
    if (res.ok) {
      await fetchDelegations();
    } else {
      const data = await res.json();
      alert(data.error || 'حدث خطأ');
    }
  };

  const glass = {
    background: COLORS.white,
    border: `1px solid ${COLORS.gray200}`,
    borderRadius: '16px',
    boxShadow: `0 4px 6px ${COLORS.shadow}`
  } as const;

  if (loading) {
    return (
      <div dir="rtl" style={{ minHeight: '100vh', background: COLORS.background, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ ...glass, padding: 30, color: COLORS.gray600 }}>جاري التحميل...</div>
      </div>
    );
  }

  if (meRole !== 'ADMIN') {
    return (
      <div dir="rtl" style={{ minHeight: '100vh', background: COLORS.background, padding: 40 }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ ...glass, padding: 30 }}>
            <h1 style={{ margin: 0, color: COLORS.gray900, fontSize: 22, fontWeight: 800 }}>غير مصرح</h1>
            <p style={{ marginTop: 10, color: COLORS.gray500 }}>هذه الصفحة للمدير فقط.</p>
            <Link href="/dashboard" style={{ color: COLORS.primary, textDecoration: 'none' }}>← العودة</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: COLORS.background, padding: '40px 20px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ color: COLORS.gray900, margin: 0, fontSize: 28, fontWeight: 900 }}>🔁 التفويضات</h1>
            <div style={{ color: COLORS.gray500, fontSize: 13, marginTop: 6 }}>تفويض الاطلاع (قراءة فقط) على طلبات الموارد البشرية</div>
          </div>
          <Link href="/dashboard" style={{ ...glass, padding: '10px 16px', color: COLORS.gray900, textDecoration: 'none', fontWeight: 700 }}>← لوحة التحكم</Link>
        </div>

        {/* Create */}
        <div style={{ ...glass, padding: 24, marginBottom: 18 }}>
          <h2 style={{ color: COLORS.gray900, fontSize: 18, marginTop: 0, fontWeight: 800 }}>إنشاء تفويض</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ color: COLORS.gray600, fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>المفوّض إليه</label>
              <select value={delegateToUserId} onChange={(e) => setDelegateToUserId(e.target.value)} style={selectStyle}>
                <option value="">اختر مستخدم...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id} style={{ background: '#2D1B4E' }}>
                    {u.displayName} ({u.username})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ color: COLORS.gray600, fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>من</label>
              <input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} style={inputStyle} />
            </div>

            <div>
              <label style={{ color: COLORS.gray600, fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>إلى</label>
              <input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} style={inputStyle} />
            </div>
          </div>

          <button disabled={!canSubmit || submitting} onClick={submit} style={{ marginTop: 16, width: '100%', padding: '12px 16px', borderRadius: 12, border: 'none', background: submitting || !canSubmit ? 'rgba(212, 165, 116, 0.35)' : 'linear-gradient(135deg, #D4A574 0%, #b8935f 100%)', color: '#2D1B4E', fontWeight: 900, cursor: submitting || !canSubmit ? 'not-allowed' : 'pointer' }}>
            {submitting ? 'جاري الحفظ...' : '✅ إنشاء التفويض'}
          </button>
        </div>

        {/* List */}
        <div style={{ ...glass, padding: 24 }}>
          <h2 style={{ color: '#D4A574', fontSize: 18, marginTop: 0, fontWeight: 800 }}>قائمة التفويضات</h2>
          {delegations.length === 0 ? (
            <div style={{ color: '#9CA3AF' }}>لا توجد تفويضات.</div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {delegations.map((d) => (
                <div key={d.id} style={{ padding: 16, borderRadius: 14, border: '1px solid rgba(255,255,255,0.12)', background: d.active ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ color: 'white', fontWeight: 800 }}>
                        {d.delegateTo.displayName} <span style={{ color: '#9CA3AF', fontWeight: 600 }}>({d.delegateTo.username})</span>
                      </div>
                      <div style={{ marginTop: 6, color: '#9CA3AF', fontSize: 13 }}>
                        من: {formatDT(d.startAt)} — إلى: {formatDT(d.endAt)}
                      </div>
                      <div style={{ marginTop: 6, color: '#6B7280', fontSize: 12 }}>
                        بواسطة: {d.createdBy.displayName}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ padding: '6px 10px', borderRadius: 999, fontSize: 12, fontWeight: 800, border: `1px solid ${d.active ? '#10B981' : '#6B7280'}`, color: d.active ? '#10B981' : '#9CA3AF', background: 'rgba(0,0,0,0.2)' }}>
                        {d.active ? 'نشط' : 'منتهي/ملغي'}
                      </span>
                      {d.active && (
                        <button onClick={() => cancelDelegation(d.id)} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.5)', background: 'rgba(239,68,68,0.12)', color: '#EF4444', fontWeight: 800, cursor: 'pointer' }}>
                          إلغاء
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px',
  borderRadius: '10px',
  border: '1px solid rgba(255,255,255,0.2)',
  background: 'rgba(255,255,255,0.06)',
  color: 'white',
  fontSize: '14px'
};

const selectStyle: React.CSSProperties = {
  ...inputStyle
};

function formatDT(value: string) {
  try {
    const d = new Date(value);
    return d.toLocaleString('en-US');
  } catch {
    return value;
  }
}
