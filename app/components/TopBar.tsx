'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { HiOutlineBell, HiOutlineClipboardCheck } from 'react-icons/hi'

export default function TopBar() {
  const [unread, setUnread] = useState(0)
  const [pending, setPending] = useState(0)

  useEffect(() => {
    let mounted = true

    const load = async () => {
      try {
        const res = await fetch('/api/sidebar/counts')
        if (!res.ok) return
        const data = await res.json()
        if (!mounted) return
        setUnread(Number(data.unreadNotifications || 0))
        setPending(Number(data.pendingApprovals || 0))
      } catch {
        // ignore
      }
    }

    load()
    const t = setInterval(load, 60000)
    return () => {
      mounted = false
      clearInterval(t)
    }
  }, [])

  return (
    <div
      className="no-print"
      data-topbar="true"
      style={{
        position: 'fixed',
        top: 12,
        insetInlineEnd: 12,
        zIndex: 60,
        display: 'flex',
        gap: 10,
        alignItems: 'center'
      }}
    >
      <Link
        href="/workflows/approvals"
        aria-label="Pending approvals"
        style={{
          position: 'relative',
          width: 42,
          height: 42,
          borderRadius: 12,
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          textDecoration: 'none',
          color: '#0F172A'
        }}
      >
        <HiOutlineClipboardCheck size={20} />
        {pending > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -6,
              insetInlineEnd: -6,
              minWidth: 18,
              height: 18,
              padding: '0 5px',
              borderRadius: 999,
              background: '#EF4444',
              color: '#FFFFFF',
              fontSize: 11,
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {pending > 99 ? '99+' : pending}
          </span>
        )}
      </Link>

      <Link
        href="/notifications"
        aria-label="Notifications"
        style={{
          position: 'relative',
          width: 42,
          height: 42,
          borderRadius: 12,
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          textDecoration: 'none',
          color: '#0F172A'
        }}
      >
        <HiOutlineBell size={20} />
        {unread > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -6,
              insetInlineEnd: -6,
              minWidth: 18,
              height: 18,
              padding: '0 5px',
              borderRadius: 999,
              background: '#2563EB',
              color: '#FFFFFF',
              fontSize: 11,
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </Link>
    </div>
  )
}
