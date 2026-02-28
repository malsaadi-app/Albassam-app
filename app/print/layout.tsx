import '../globals.css'

export default function PrintLayout({ children }: { children: React.ReactNode }) {
  // Separate layout for print pages.
  return <div style={{ background: 'white' }}>{children}</div>
}
