import type { Metadata } from 'next'
import '../globals.css'
import DesignSystemStyles from '../components/ui/DesignSystemStyles'

export const metadata: Metadata = {
  title: 'تسجيل الدخول - نظام مدارس البسام',
  description: 'تسجيل الدخول إلى نظام إدارة المهام والموارد البشرية',
}

// Auth layout WITHOUT sidebar (for login page security)
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DesignSystemStyles />
      <style dangerouslySetInnerHTML={{__html: `
        /* Hide sidebar completely on auth pages */
        aside[class*="sidebar"],
        aside[style*="fixed"],
        button[style*="fixed"][style*="hamburger"],
        .ds-sidebar,
        .ds-sidebar-hamburger {
          display: none !important;
        }
        /* Remove sidebar padding from main */
        main.ds-app-main {
          padding-right: 0 !important;
          padding-top: 0 !important;
        }
      `}} />
      {children}
    </>
  )
}
