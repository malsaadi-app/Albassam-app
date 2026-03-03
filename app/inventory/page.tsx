'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function InventoryPage() {
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('')
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const categories = useMemo(() => {
    const set = new Set<string>()
    for (const i of items) set.add(String(i.category || ''))
    return Array.from(set).filter(Boolean).sort()
  }, [items])

  const load = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (q.trim()) params.set('q', q.trim())
    if (category) params.set('category', category)
    const res = await fetch(`/api/inventory/items?${params.toString()}`)
    const data = await res.json().catch(() => ({}))
    setItems(Array.isArray(data.items) ? data.items : [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div style={{ padding: 16, display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>المخزون</div>
          <div style={{ color: '#64748B', fontSize: 12 }}>إدارة الأصناف + الأرصدة + حركات الصرف/الإضافة</div>
        </div>
        <Link href="/inventory/new"><Button variant="primary">➕ إضافة صنف</Button></Link>
      </div>

      <Card variant="default">
        <div style={{ padding: 12, display: 'grid', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث بالكود أو الاسم…" style={{ padding: 12, borderRadius: 12, border: '1px solid #E5E7EB' }} />
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ padding: 12, borderRadius: 12, border: '1px solid #E5E7EB', background: 'white' }}>
              <option value="">كل التصنيفات</option>
              {categories.map((c) => (<option key={c} value={c}>{c}</option>))}
            </select>
            <Button variant="outline" onClick={load}>تحديث</Button>
          </div>
        </div>
      </Card>

      <Card variant="default">
        <div style={{ padding: 12 }}>
          {loading ? (
            <div>جاري التحميل…</div>
          ) : items.length === 0 ? (
            <div style={{ color: '#64748B' }}>لا يوجد أصناف.</div>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {items.map((i) => (
                <Link key={i.id} href={`/inventory/${i.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{ border: '1px solid #E5E7EB', borderRadius: 14, padding: 12, background: 'white', display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontWeight: 900, color: '#0F172A' }}>{i.itemName}</div>
                      <div style={{ color: '#64748B', fontSize: 12 }}>{i.itemCode} • {i.category} • {i.unit}</div>
                    </div>
                    <div style={{ textAlign: 'end' }}>
                      <div style={{ fontWeight: 900 }}>الرصيد: {i.currentStock}</div>
                      <div style={{ color: '#64748B', fontSize: 12 }}>الحد الأدنى: {i.minStock}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
