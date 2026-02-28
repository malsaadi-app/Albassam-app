'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function NewFinanceRequestPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [type, setType] = useState('GOV_FEE')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [beneficiaryName, setBeneficiaryName] = useState('')

  const [attachments, setAttachments] = useState<Array<{ name: string; url: string }>>([])
  const [uploading, setUploading] = useState(false)

  const uploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData()
        fd.append('file', file)

        // Use the stricter upload endpoint (PDF/JPG/PNG, 10MB)
        const res = await fetch('/api/upload/approvals', {
          method: 'POST',
          body: fd
        })

        const data = await res.json()
        if (!res.ok) {
          alert(data.error || 'فشل رفع الملف')
          continue
        }

        setAttachments((prev) => [...prev, { name: data.filename, url: data.path }])
      }
    } finally {
      setUploading(false)
    }
  }

  const removeAttachment = (idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx))
  }

  const submit = async () => {
    setLoading(true)
    try {
      if (!attachments.length) {
        alert('المرفقات مطلوبة')
        return
      }

      const res = await fetch('/api/finance/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          title,
          description,
          amount: Number(amount),
          beneficiaryName,
          attachments,
          department: 'HR'
        })
      })

      const data = await res.json()
      if (!res.ok) {
        alert(data.error || 'خطأ')
        return
      }

      router.push(`/finance/requests/${data.request.id}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 16 }}>
      <PageHeader
        title="طلب مالي جديد"
        breadcrumbs={['الرئيسية', 'المالية', 'طلب جديد']}
        actions={
          <>
            <Button variant="outline" onClick={() => router.back()}>
              ← رجوع
            </Button>
            <Button variant="success" onClick={submit} disabled={loading}>
              {loading ? '...' : 'إرسال'}
            </Button>
          </>
        }
      />

      <Card style={{ padding: 16, maxWidth: 820 }}>
        <div style={{ display: 'grid', gap: 12 }}>
          <label>
            النوع
            <select value={type} onChange={(e) => setType(e.target.value)} style={{ width: '100%', marginTop: 6, padding: 10 }}>
              <option value="GOV_FEE">سداد رسوم حكومية</option>
              <option value="BILL_PAYMENT">سداد فاتورة</option>
              <option value="REIMBURSEMENT">استرداد مبلغ</option>
              <option value="PETTY_CASH">صرف عهدة</option>
            </select>
          </label>

          <label>
            العنوان
            <input value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: '100%', marginTop: 6, padding: 10 }} />
          </label>

          <label>
            الوصف
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} style={{ width: '100%', marginTop: 6, padding: 10 }} />
          </label>

          <label>
            المبلغ
            <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" style={{ width: '100%', marginTop: 6, padding: 10 }} />
          </label>

          <label>
            المستفيد
            <input value={beneficiaryName} onChange={(e) => setBeneficiaryName(e.target.value)} style={{ width: '100%', marginTop: 6, padding: 10 }} />
          </label>

          <label>
            المرفقات (PDF / JPG / PNG)
            <input
              type="file"
              multiple
              accept="application/pdf,image/png,image/jpeg"
              onChange={(e) => uploadFiles(e.target.files)}
              disabled={uploading}
              style={{ width: '100%', marginTop: 6 }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#6B7280' }}>
              {uploading ? 'جاري رفع الملفات...' : 'حد أقصى 10MB لكل ملف.'}
            </div>
            {attachments.length > 0 && (
              <ul style={{ marginTop: 10 }}>
                {attachments.map((a, idx) => (
                  <li key={idx} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
                    <a href={a.url} target="_blank" rel="noreferrer">
                      {a.name}
                    </a>
                    <button
                      type="button"
                      onClick={() => removeAttachment(idx)}
                      style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}
                    >
                      حذف
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </label>
        </div>
      </Card>
    </div>
  )
}
