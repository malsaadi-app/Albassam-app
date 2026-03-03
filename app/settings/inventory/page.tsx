'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function InventorySettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [allowNegativeStock, setAllowNegativeStock] = useState(true)

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/settings/inventory')
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      setAllowNegativeStock(data.settings?.allowNegativeStock !== false)
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const save = async () => {
    setSaving(true)
    const res = await fetch('/api/settings/inventory', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ allowNegativeStock }),
    })
    const data = await res.json().catch(() => ({}))
    setSaving(false)
    if (!res.ok) {
      alert(data.error || 'فشل')
      return
    }
    alert('✅ تم الحفظ')
    await load()
  }

  return (
    <div style={{ padding: 16, display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>إعدادات المخزون</div>
          <div style={{ color: '#64748B', fontSize: 12 }}>سياسات تشغيل المخزون</div>
        </div>
        <Link href="/settings/general"><Button variant="outline">رجوع للإعدادات</Button></Link>
      </div>

      <Card variant="default">
        <div style={{ padding: 16, display: 'grid', gap: 12 }}>
          {loading ? (
            <div>جاري التحميل…</div>
          ) : (
            <>
              <label style={{ display: 'flex', gap: 10, alignItems: 'center', fontWeight: 900 }}>
                <input type="checkbox" checked={allowNegativeStock} onChange={(e) => setAllowNegativeStock(e.target.checked)} />
                السماح بالصرف بدون رصيد (رصيد سالب)
              </label>
              <div style={{ color: '#64748B', fontSize: 12, lineHeight: 1.7 }}>
                إذا تم إلغاء هذا الخيار، سيتم منع أي حركة OUT تسبب رصيدًا سالبًا.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="primary" onClick={save} disabled={saving}>حفظ</Button>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  )
}
