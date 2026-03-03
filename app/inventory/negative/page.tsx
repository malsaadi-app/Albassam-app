'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function NegativeStockPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/inventory/items/negative')
    const data = await res.json().catch(() => ({}))
    setItems(Array.isArray(data.items) ? data.items : [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div style={{ padding: 16, display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>الأرصدة السالبة</div>
          <div style={{ color: '#64748B', fontSize: 12 }}>عناصر تم صرفها بأكثر من الرصيد — تحتاج مراجعة/تسوية</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link href="/inventory"><Button variant="outline">رجوع للمخزون</Button></Link>
          <Button variant="outline" onClick={load}>تحديث</Button>
        </div>
      </div>

      <Card variant="default">
        <div style={{ padding: 12 }}>
          {loading ? (
            <div>جاري التحميل…</div>
          ) : items.length === 0 ? (
            <div style={{ color: '#64748B' }}>لا يوجد أرصدة سالبة ✅</div>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {items.map((i) => (
                <Link key={i.id} href={`/inventory/${i.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{ border: '1px solid #FCA5A5', borderRadius: 14, padding: 12, background: '#FEF2F2', display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontWeight: 900, color: '#0F172A' }}>{i.itemName}</div>
                      <div style={{ color: '#64748B', fontSize: 12 }}>{i.itemCode} • {i.category} • {i.unit}</div>
                    </div>
                    <div style={{ textAlign: 'end' }}>
                      <div style={{ fontWeight: 900, color: '#991B1B' }}>الرصيد: {i.currentStock}</div>
                      <div style={{ color: '#64748B', fontSize: 12 }}>آخر تحديث: {new Date(i.updatedAt).toLocaleString()}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </Card>

      <Card variant="default">
        <div style={{ padding: 12, color: '#64748B', fontSize: 12, lineHeight: 1.7 }}>
          <div style={{ fontWeight: 900, color: '#0F172A', marginBottom: 6 }}>ملاحظة تشغيلية</div>
          <div>
            في مرحلة بناء المخزون (MVP) سمحنا بالصرف حتى لو الرصيد غير كافي (Overdraft) لتجنب تعطيل العمل.
            المطلوب لاحقًا: جرد/تسويات أو إدخال حركات IN صحيحة لتصفير الأرصدة السالبة.
          </div>
        </div>
      </Card>
    </div>
  )
}
