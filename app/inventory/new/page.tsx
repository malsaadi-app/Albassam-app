'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function NewStockItemPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<any>({
    itemCode: '',
    itemName: '',
    category: '',
    unit: 'حبة',
    minStock: 0,
    unitCost: 0,
    location: '',
    notes: '',
  })

  const save = async () => {
    setSaving(true)
    const res = await fetch('/api/inventory/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json().catch(() => ({}))
    setSaving(false)
    if (!res.ok) {
      alert(data.error || 'فشل')
      return
    }
    router.push(`/inventory/${data.item.id}`)
  }

  const input = (k: string) => ({
    value: form[k] ?? '',
    onChange: (e: any) => setForm((p: any) => ({ ...p, [k]: e.target.value })),
  })

  return (
    <div style={{ padding: 16, display: 'grid', gap: 12 }}>
      <div style={{ fontSize: 22, fontWeight: 900 }}>إضافة صنف مخزون</div>
      <Card variant="default">
        <div style={{ padding: 16, display: 'grid', gap: 10 }}>
          <label style={{ fontWeight: 900 }}>كود الصنف</label>
          <input {...input('itemCode')} style={{ padding: 12, borderRadius: 12, border: '1px solid #E5E7EB' }} />
          <label style={{ fontWeight: 900 }}>اسم الصنف</label>
          <input {...input('itemName')} style={{ padding: 12, borderRadius: 12, border: '1px solid #E5E7EB' }} />
          <label style={{ fontWeight: 900 }}>التصنيف</label>
          <input {...input('category')} style={{ padding: 12, borderRadius: 12, border: '1px solid #E5E7EB' }} />
          <label style={{ fontWeight: 900 }}>الوحدة</label>
          <input {...input('unit')} style={{ padding: 12, borderRadius: 12, border: '1px solid #E5E7EB' }} />
          <label style={{ fontWeight: 900 }}>الحد الأدنى</label>
          <input {...input('minStock')} inputMode="numeric" style={{ padding: 12, borderRadius: 12, border: '1px solid #E5E7EB' }} />
          <label style={{ fontWeight: 900 }}>سعر الوحدة (تقريبي)</label>
          <input {...input('unitCost')} inputMode="decimal" style={{ padding: 12, borderRadius: 12, border: '1px solid #E5E7EB' }} />
          <label style={{ fontWeight: 900 }}>الموقع</label>
          <input {...input('location')} style={{ padding: 12, borderRadius: 12, border: '1px solid #E5E7EB' }} />
          <label style={{ fontWeight: 900 }}>ملاحظات</label>
          <textarea {...input('notes')} style={{ padding: 12, borderRadius: 12, border: '1px solid #E5E7EB', minHeight: 90 }} />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
            <Button variant="outline" onClick={() => router.back()}>إلغاء</Button>
            <Button variant="primary" onClick={save} disabled={saving}>حفظ</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
