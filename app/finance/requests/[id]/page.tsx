'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { getInitialLocale } from '@/lib/i18n'

export default function FinanceRequestDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [me, setMe] = useState<any>(null)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const [comment, setComment] = useState('')
  const [uploading, setUploading] = useState(false)

  // Petty cash settlement
  const [settlement, setSettlement] = useState<any>(null)
  const [settlementItems, setSettlementItems] = useState<any[]>([])
  const [settlementTopUps, setSettlementTopUps] = useState<any[]>([])
  const [settlementLoading, setSettlementLoading] = useState(false)

  const [topUpAmount, setTopUpAmount] = useState('')
  const [topUpReason, setTopUpReason] = useState('')
  const [topUpComment, setTopUpComment] = useState('')
  const [topUpActing, setTopUpActing] = useState(false)

  const [itemVendor, setItemVendor] = useState('')
  const [itemDesc, setItemDesc] = useState('')
  const [itemAmount, setItemAmount] = useState('')
  const [itemDate, setItemDate] = useState('')
  const [itemAttachments, setItemAttachments] = useState<Array<{ name: string; url: string }>>([])
  const [itemUploading, setItemUploading] = useState(false)

  const [settlementComment, setSettlementComment] = useState('')
  const [settlementActing, setSettlementActing] = useState(false)

  const fetchSettlement = async (financeType?: string) => {
    if (financeType && financeType !== 'PETTY_CASH') return

    try {
      setSettlementLoading(true)
      const res = await fetch(`/api/finance/petty-cash/${id}/settlement`)
      const d = await res.json()
      if (res.ok) {
        setSettlement(d.settlement)
        setSettlementItems(d.items || [])
        setSettlementTopUps(d.topUps || [])
      }
    } finally {
      setSettlementLoading(false)
    }
  }

  const fetchOne = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/finance/requests/${id}`)
      const d = await res.json()
      if (res.ok) {
        setData(d)
        await fetchSettlement(d.type)
      } else {
        alert(d.error || 'خطأ')
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchMe = async () => {
    try {
      const res = await fetch('/api/auth/me')
      const d = await res.json()
      if (res.ok) setMe(d.user)
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    fetchMe()
    fetchOne()
  }, [id])

  const uploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch('/api/upload/approvals', { method: 'POST', body: fd })
        const u = await res.json()
        if (!res.ok) {
          alert(u.error || 'فشل رفع الملف')
          continue
        }

        const addRes = await fetch(`/api/finance/requests/${id}/attachments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ attachment: { name: u.filename, url: u.path } })
        })

        const addData = await addRes.json()
        if (!addRes.ok) {
          alert(addData.error || 'فشل حفظ المرفق')
          continue
        }

        setData((prev: any) => ({ ...prev, attachments: addData.attachments }))
      }
    } finally {
      setUploading(false)
    }
  }

  const uploadItemFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    setItemUploading(true)
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch('/api/upload/approvals', { method: 'POST', body: fd })
        const u = await res.json()
        if (!res.ok) {
          alert(u.error || 'فشل رفع الملف')
          continue
        }
        setItemAttachments((prev) => [...prev, { name: u.filename, url: u.path }])
      }
    } finally {
      setItemUploading(false)
    }
  }

  const removeItemAttachment = (idx: number) => {
    setItemAttachments((prev) => prev.filter((_, i) => i !== idx))
  }

  const addSettlementItem = async () => {
    if (!itemDesc.trim() || !itemAmount) {
      alert('البيانات المطلوبة ناقصة')
      return
    }

    const res = await fetch(`/api/finance/petty-cash/${id}/settlement/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vendor: itemVendor || null,
        description: itemDesc,
        amount: Number(itemAmount),
        date: itemDate || null,
        attachments: itemAttachments
      })
    })

    const d = await res.json()
    if (!res.ok) {
      alert(d.error || 'خطأ')
      return
    }

    setItemVendor('')
    setItemDesc('')
    setItemAmount('')
    setItemDate('')
    setItemAttachments([])

    await fetchSettlement('PETTY_CASH')
  }

  const createTopUp = async () => {
    if (!topUpAmount || Number(topUpAmount) <= 0 || !topUpReason.trim()) {
      alert('المبلغ والسبب مطلوبين')
      return
    }

    setTopUpActing(true)
    try {
      const res = await fetch(`/api/finance/petty-cash/${id}/topups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(topUpAmount), reason: topUpReason })
      })
      const d = await res.json()
      if (!res.ok) {
        alert(d.error || 'خطأ')
        return
      }
      setTopUpAmount('')
      setTopUpReason('')
      await fetchSettlement('PETTY_CASH')
    } finally {
      setTopUpActing(false)
    }
  }

  const actTopUp = async (topUpId: string, action: 'approve' | 'reject' | 'mark-paid') => {
    setTopUpActing(true)
    try {
      const res = await fetch(`/api/finance/petty-cash/topups/${topUpId}/process-step`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, comment: topUpComment })
      })
      const d = await res.json()
      if (!res.ok) {
        alert(d.error || 'خطأ')
        return
      }
      setTopUpComment('')
      await fetchSettlement('PETTY_CASH')
    } finally {
      setTopUpActing(false)
    }
  }

  const submitSettlement = async () => {
    const res = await fetch(`/api/finance/petty-cash/${id}/settlement/submit`, { method: 'POST' })
    const d = await res.json()
    if (!res.ok) {
      alert(d.error || 'خطأ')
      return
    }
    await fetchSettlement('PETTY_CASH')
  }

  const actSettlement = async (action: 'approve' | 'reject') => {
    setSettlementActing(true)
    try {
      const res = await fetch(`/api/finance/petty-cash/${id}/settlement/process-step`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, comment: settlementComment })
      })
      const d = await res.json()
      if (!res.ok) {
        alert(d.error || 'خطأ')
        return
      }
      setSettlementComment('')
      await fetchSettlement('PETTY_CASH')
    } finally {
      setSettlementActing(false)
    }
  }

  const act = async (action: 'approve' | 'reject') => {
    const res = await fetch(`/api/finance/requests/${id}/process-step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, comment })
    })
    const d = await res.json()
    if (!res.ok) {
      alert(d.error || 'خطأ')
      return
    }
    setComment('')
    await fetchOne()
  }

  const markPaid = async () => {
    const res = await fetch(`/api/finance/requests/${id}/mark-paid`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment })
    })
    const d = await res.json()
    if (!res.ok) {
      alert(d.error || 'خطأ')
      return
    }
    setComment('')
    await fetchOne()
  }

  if (loading) return <div style={{ padding: 24 }}>جاري التحميل...</div>
  if (!data) return <div style={{ padding: 24 }}>غير موجود</div>

  const isAdmin = me?.role === 'ADMIN'
  const isRequester = me?.id && data.requesterId ? me.id === data.requesterId : false
  const isAccountant = me?.id && data.accountantUserId ? me.id === data.accountantUserId : false
  const isFinanceMgr = me?.id && data.financeManagerUserId ? me.id === data.financeManagerUserId : false

  const totalExpenses = settlementItems.reduce((sum, it) => sum + Number(it.amount || 0), 0)
  const totalTopUpsPaid = settlementTopUps
    .filter((t) => t.status === 'PAID')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0)

  const available = Number(data.amount || 0) + totalTopUpsPaid
  const remaining = available - totalExpenses

  return (
    <div style={{ padding: 16 }}>
      <PageHeader
        title={`طلب مالي ${data.requestNumber}`}
        breadcrumbs={['الرئيسية', 'المالية', 'تفاصيل']}
        actions={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button
              variant="outline"
              onClick={() => {
                const locale = getInitialLocale()
                window.open(`/print/finance/requests/${id}?locale=${locale}`, '_blank')
              }}
            >
              🖨️ طباعة
            </Button>
            <Button variant="outline" onClick={() => router.push('/finance/requests')}>
              ← رجوع
            </Button>
          </div>
        }
      />

      <div style={{ display: 'grid', gap: 12, maxWidth: 900 }}>
        <Card style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontWeight: 900 }}>{data.title}</div>
              <div style={{ color: '#6B7280', marginTop: 6 }}>{data.type}</div>
              <div style={{ color: '#6B7280', marginTop: 6 }}>{data.requester?.displayName}</div>
            </div>
            <div style={{ textAlign: 'left' }}>
              <Badge variant={data.status === 'REJECTED' ? 'red' : data.status === 'PAID' ? 'green' : 'yellow'}>
                {data.status}
              </Badge>
              <div style={{ marginTop: 10, fontWeight: 900 }}>{Number(data.amount).toFixed(2)}</div>
              <div style={{ marginTop: 6, fontSize: 12, color: '#6B7280' }}>Step: {data.currentStep}</div>
            </div>
          </div>

          {data.description && <div style={{ marginTop: 12 }}>{data.description}</div>}
          {data.beneficiaryName && <div style={{ marginTop: 8, color: '#6B7280' }}>المستفيد: {data.beneficiaryName}</div>}

          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ fontWeight: 800 }}>المرفقات</div>
              <label style={{ fontSize: 12, color: '#6B7280' }}>
                <input
                  type="file"
                  multiple
                  accept="application/pdf,image/png,image/jpeg"
                  onChange={(e) => uploadFiles(e.target.files)}
                  disabled={uploading}
                />
                <span style={{ marginRight: 8 }}>{uploading ? 'جاري الرفع...' : 'إضافة مرفقات'}</span>
              </label>
            </div>

            {data.attachments?.length ? (
              <ul style={{ marginTop: 8 }}>
                {data.attachments.map((a: any, idx: number) => (
                  <li key={idx}>
                    <a href={a.url} target="_blank" rel="noreferrer">
                      {a.name || a.url}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <div style={{ marginTop: 8, fontSize: 12, color: '#6B7280' }}>لا توجد مرفقات</div>
            )}
          </div>

          {data.status === 'REJECTED' && data.rejectionReason ? (
            <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: '#FEE2E2', color: '#991B1B' }}>
              سبب الرفض: {data.rejectionReason}
            </div>
          ) : null}
        </Card>

        {data.type === 'PETTY_CASH' && (
          <Card style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ fontWeight: 900 }}>تسوية العهدة</div>
              <Badge variant={settlement?.status === 'REJECTED' ? 'red' : settlement?.status === 'FINANCE_MANAGER_APPROVED' ? 'green' : 'yellow'}>
                {settlement?.status ?? '—'}
              </Badge>
            </div>

            {data.status !== 'PAID' ? (
              <div style={{ marginTop: 10, color: '#6B7280' }}>لا يمكن بدء التسوية قبل صرف العهدة (مرحلة التنفيذ).</div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12 }}>
                  <div style={{ fontWeight: 800 }}>المتاح: {available.toFixed(2)}</div>
                  <div style={{ fontWeight: 800 }}>المصروف: {totalExpenses.toFixed(2)}</div>
                  <div style={{ fontWeight: 800 }}>زيادات (مدفوعة): {totalTopUpsPaid.toFixed(2)}</div>
                  <div style={{ fontWeight: 900, color: remaining < 0 ? '#991B1B' : '#065F46' }}>
                    المتبقي: {remaining.toFixed(2)}
                  </div>
                </div>

                {settlementLoading ? (
                  <div style={{ marginTop: 10, color: '#6B7280' }}>جاري التحميل...</div>
                ) : (
                  <>
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontWeight: 800, marginBottom: 6 }}>بنود المصروفات</div>
                      {settlementItems.length === 0 ? (
                        <div style={{ fontSize: 12, color: '#6B7280' }}>لا توجد بنود بعد</div>
                      ) : (
                        <ul>
                          {settlementItems.map((it) => (
                            <li key={it.id} style={{ marginBottom: 8 }}>
                              <div style={{ fontWeight: 800 }}>
                                {it.description} — {Number(it.amount).toFixed(2)}
                              </div>
                              <div style={{ fontSize: 12, color: '#6B7280' }}>
                                {it.vendor ? `المورد: ${it.vendor} • ` : ''}
                                {it.date ? new Date(it.date).toLocaleDateString('ar-SA') : ''}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {(isRequester || isAdmin) && remaining < 0 && (
                      <div style={{ marginTop: 12, borderTop: '1px solid #E5E7EB', paddingTop: 12 }}>
                        <div style={{ fontWeight: 900, marginBottom: 10 }}>طلب زيادة عهدة</div>
                        <div style={{ display: 'grid', gap: 10 }}>
                          <input
                            value={topUpAmount}
                            onChange={(e) => setTopUpAmount(e.target.value)}
                            placeholder="مبلغ الزيادة"
                            type="number"
                            style={{ width: '100%', padding: 10 }}
                          />
                          <textarea
                            value={topUpReason}
                            onChange={(e) => setTopUpReason(e.target.value)}
                            rows={2}
                            placeholder="سبب الزيادة"
                            style={{ width: '100%', padding: 10 }}
                          />
                          <Button variant="primary" onClick={createTopUp} disabled={topUpActing}>
                            إرسال طلب زيادة
                          </Button>
                          <div style={{ fontSize: 12, color: '#6B7280' }}>
                            ملاحظة: طلب الزيادة يمر على المحاسب ثم المدير المالي ثم يُصرف.
                          </div>
                        </div>
                      </div>
                    )}

                    {settlementTopUps.length > 0 && (
                      <div style={{ marginTop: 12, borderTop: '1px solid #E5E7EB', paddingTop: 12 }}>
                        <div style={{ fontWeight: 900, marginBottom: 10 }}>طلبات زيادة العهدة</div>
                        <ul>
                          {settlementTopUps.map((t) => (
                            <li key={t.id} style={{ marginBottom: 10 }}>
                              <div style={{ fontWeight: 800 }}>
                                {Number(t.amount).toFixed(2)} — {t.status}
                              </div>
                              <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{t.reason}</div>
                              {t.status === 'REJECTED' && t.rejectionReason && (
                                <div style={{ marginTop: 6, padding: 10, borderRadius: 10, background: '#FEE2E2', color: '#991B1B' }}>
                                  سبب الرفض: {t.rejectionReason}
                                </div>
                              )}

                              {(isAccountant || isFinanceMgr || isAdmin) && (t.status === 'PENDING' || t.status === 'APPROVED') && (
                                <div style={{ marginTop: 8 }}>
                                  <textarea
                                    value={topUpComment}
                                    onChange={(e) => setTopUpComment(e.target.value)}
                                    rows={2}
                                    placeholder="تعليق (مطلوب عند الرفض)"
                                    style={{ width: '100%', padding: 10 }}
                                  />
                                  <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
                                    {t.status === 'PENDING' && (
                                      <>
                                        <Button variant="success" onClick={() => actTopUp(t.id, 'approve')} disabled={topUpActing}>
                                          موافقة
                                        </Button>
                                        <Button variant="danger" onClick={() => actTopUp(t.id, 'reject')} disabled={topUpActing}>
                                          رفض
                                        </Button>
                                      </>
                                    )}
                                    {t.status === 'APPROVED' && (isAccountant || isAdmin) && (
                                      <Button variant="primary" onClick={() => actTopUp(t.id, 'mark-paid')} disabled={topUpActing}>
                                        تم صرف الزيادة
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {(isRequester || isAdmin) && (settlement?.status === 'DRAFT' || settlement?.status === 'REJECTED' || !settlement) && (
                      <div style={{ marginTop: 12, borderTop: '1px solid #E5E7EB', paddingTop: 12 }}>
                        <div style={{ fontWeight: 900, marginBottom: 10 }}>إضافة بند</div>
                        <div style={{ display: 'grid', gap: 10 }}>
                          <input
                            value={itemVendor}
                            onChange={(e) => setItemVendor(e.target.value)}
                            placeholder="المورد (اختياري)"
                            style={{ width: '100%', padding: 10 }}
                          />
                          <input
                            value={itemDesc}
                            onChange={(e) => setItemDesc(e.target.value)}
                            placeholder="الوصف"
                            style={{ width: '100%', padding: 10 }}
                          />
                          <input
                            value={itemAmount}
                            onChange={(e) => setItemAmount(e.target.value)}
                            placeholder="المبلغ"
                            type="number"
                            style={{ width: '100%', padding: 10 }}
                          />
                          <input
                            value={itemDate}
                            onChange={(e) => setItemDate(e.target.value)}
                            type="date"
                            style={{ width: '100%', padding: 10 }}
                          />

                          <div>
                            <div style={{ fontWeight: 800, marginBottom: 6 }}>مرفقات البند (فاتورة)</div>
                            <input
                              type="file"
                              multiple
                              accept="application/pdf,image/png,image/jpeg"
                              onChange={(e) => uploadItemFiles(e.target.files)}
                              disabled={itemUploading}
                            />
                            <div style={{ marginTop: 6, fontSize: 12, color: '#6B7280' }}>
                              {itemUploading ? 'جاري رفع الملفات...' : ''}
                            </div>
                            {itemAttachments.length > 0 && (
                              <ul style={{ marginTop: 8 }}>
                                {itemAttachments.map((a, idx) => (
                                  <li key={idx} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                    <a href={a.url} target="_blank" rel="noreferrer">
                                      {a.name}
                                    </a>
                                    <button
                                      type="button"
                                      onClick={() => removeItemAttachment(idx)}
                                      style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}
                                    >
                                      حذف
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>

                          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            <Button variant="success" onClick={addSettlementItem}>
                              إضافة البند
                            </Button>
                            <Button
                              variant="primary"
                              onClick={submitSettlement}
                              disabled={settlementItems.length === 0 || settlementActing}
                            >
                              إرسال التسوية
                            </Button>
                          </div>

                          {settlement?.status === 'REJECTED' && settlement?.rejectionReason && (
                            <div style={{ marginTop: 10, padding: 12, borderRadius: 12, background: '#FEE2E2', color: '#991B1B' }}>
                              سبب رفض التسوية: {settlement.rejectionReason}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {(isAccountant || isFinanceMgr || isAdmin) && (settlement?.status === 'SUBMITTED' || settlement?.status === 'ACCOUNTANT_APPROVED') && (
                      <div style={{ marginTop: 12, borderTop: '1px solid #E5E7EB', paddingTop: 12 }}>
                        <div style={{ fontWeight: 900, marginBottom: 10 }}>اعتماد التسوية</div>
                        <textarea
                          value={settlementComment}
                          onChange={(e) => setSettlementComment(e.target.value)}
                          rows={3}
                          placeholder="تعليق (مطلوب عند الرفض)"
                          style={{ width: '100%', padding: 10 }}
                        />
                        <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
                          <Button variant="success" onClick={() => actSettlement('approve')} disabled={settlementActing}>
                            موافقة
                          </Button>
                          <Button variant="danger" onClick={() => actSettlement('reject')} disabled={settlementActing}>
                            رفض
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Requester should not see approval comments, only rejection reason */}
                  </>
                )}
              </>
            )}
          </Card>
        )}

        <Card style={{ padding: 16 }}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>إجراء</div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="تعليق (مطلوب عند الرفض)"
            style={{ width: '100%', padding: 10 }}
          />
          <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
            <Button variant="success" onClick={() => act('approve')}>
              موافقة
            </Button>
            <Button variant="danger" onClick={() => act('reject')}>
              رفض
            </Button>
            {data.currentStep === 'ACCOUNTANT_EXECUTION' && (
              <Button variant="primary" onClick={markPaid}>
                تم التحويل/السداد
              </Button>
            )}
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: '#6B7280' }}>
            ملاحظة: التعليقات لا تظهر لمقدم الطلب إلا في حالة الرفض.
          </div>
        </Card>
      </div>
    </div>
  )
}
