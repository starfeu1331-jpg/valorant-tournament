import { ReactNode } from 'react'
import '../globals.css'

export default function OverlayLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="fr">
      <head />
      <body style={{ margin: 0, padding: 0, background: 'transparent' }}>
        {children}
      </body>
    </html>
  )
}
