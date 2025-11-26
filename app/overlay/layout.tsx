import { ReactNode } from 'react'
import '../globals.css'

export default function OverlayLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="fr" className="bg-transparent">
      <body className="bg-transparent">
        {children}
      </body>
    </html>
  )
}
