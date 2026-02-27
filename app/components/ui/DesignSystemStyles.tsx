export default function DesignSystemStyles() {
  return (
    <style
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{
        __html: `
:root {
  /* Design System (ds) tokens - keep separate from legacy vars */
  --ds-font-sans: 'Cairo', system-ui, -apple-system, 'Segoe UI', Arial, sans-serif;

  --ds-brand-900: #1D0B3E;
  --ds-brand-800: #2D1B4E;
  --ds-brand-700: #3D2B5E;

  --ds-accent-600: #C49564;
  --ds-accent-500: #D4A574;
  --ds-accent-400: #E4B584;

  --ds-info: #3B82F6;
  --ds-success: #10B981;
  --ds-warning: #F59E0B;
  --ds-danger: #EF4444;

  --ds-bg: #F7F8FB;
  --ds-bg-elevated: rgba(255,255,255,0.72);
  --ds-surface: #FFFFFF;
  --ds-surface-2: #F1F5F9;

  --ds-text: #0F172A;
  --ds-text-2: #334155;
  --ds-muted: #64748B;

  --ds-border: rgba(15, 23, 42, 0.10);
  --ds-border-strong: rgba(15, 23, 42, 0.16);

  --ds-radius-sm: 10px;
  --ds-radius-md: 14px;
  --ds-radius-lg: 18px;

  --ds-shadow-sm: 0 1px 2px rgba(2, 6, 23, 0.06);
  --ds-shadow-md: 0 10px 30px rgba(2, 6, 23, 0.10);
  --ds-shadow-glow: 0 16px 40px rgba(45, 27, 78, 0.16);

  --ds-ring: 0 0 0 3px rgba(212, 165, 116, 0.22);
}

@media (prefers-color-scheme: dark) {
  :root {
    --ds-bg: #070A13;
    --ds-bg-elevated: rgba(17, 24, 39, 0.55);
    --ds-surface: rgba(17, 24, 39, 0.88);
    --ds-surface-2: rgba(31, 41, 55, 0.75);

    --ds-text: #F8FAFC;
    --ds-text-2: #E2E8F0;
    --ds-muted: #94A3B8;

    --ds-border: rgba(255,255,255,0.10);
    --ds-border-strong: rgba(255,255,255,0.16);

    --ds-shadow-sm: 0 1px 2px rgba(0,0,0,0.40);
    --ds-shadow-md: 0 18px 48px rgba(0,0,0,0.45);
    --ds-shadow-glow: 0 24px 64px rgba(212, 165, 116, 0.12);
  }
}

@keyframes ds-fade-up {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes ds-pulse-soft {
  0%, 100% { transform: scale(1); opacity: 0.95; }
  50% { transform: scale(1.04); opacity: 1; }
}

@keyframes ds-spin {
  to { transform: rotate(360deg); }
}

/* Better focus ring without requiring client handlers */
.ds-focusable:focus-visible {
  outline: none;
  box-shadow: var(--ds-ring);
}

/* Optional, safe hover micro-interactions */
@media (hover:hover) {
  .ds-card-hover:hover {
    transform: translateY(-2px);
    box-shadow: var(--ds-shadow-glow);
    border-color: var(--ds-border-strong);
  }
}

/* ---- Responsive layout helpers (mobile-first) ---- */
.ds-app-main {
  /* Prevent content being hidden under the fixed mobile hamburger */
  padding-top: calc(env(safe-area-inset-top) + 76px);
  background: var(--ds-bg);
}

/* Dashboard: stack on mobile/tablet, 2 columns on desktop */
.ds-dashboard-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  align-items: start;
}

/* Hero actions: full-width buttons on mobile for better touch targets */
@media (max-width: 767px) {
  .ds-dashboard-heroActions {
    width: 100%;
  }

  .ds-dashboard-heroActions a {
    width: 100%;
  }
}

/* Desktop breakpoint */
@media (min-width: 1024px) {
  .ds-app-main {
    padding-top: 0;
    padding-right: 280px; /* fixed sidebar width */
  }

  .ds-dashboard-layout {
    grid-template-columns: 1.25fr 0.85fr;
  }

  /* Sidebar pinned on desktop */
  .ds-sidebar {
    right: 0 !important;
    transition: none !important;
    padding-top: 24px !important;
  }

  .ds-sidebar-hamburger {
    display: none !important;
  }

  .ds-sidebar-overlay {
    display: none !important;
  }
}

/* ===========================
   FORCE WESTERN/LATIN NUMERALS (0-9)
   Instead of Arabic-Indic (٠-٩)
   =========================== */
* {
  font-variant-numeric: lining-nums !important;
  -moz-font-feature-settings: "lnum" 1;
  -webkit-font-feature-settings: "lnum" 1;
  font-feature-settings: "lnum" 1;
}

        `.trim()
      }}
    />
  )
}
