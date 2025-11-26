import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Live Overlay - EVY Tournament',
}

export default function LiveOverlayLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, padding: 0, background: 'transparent', overflow: 'hidden' }}>
        {children}
      </body>
    </html>
  )
}
