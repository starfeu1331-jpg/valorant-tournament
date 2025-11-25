'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export function Alert({ 
  type, 
  message,
  teamId 
}: { 
  type: 'error' | 'success'
  message: string
  teamId: string
}) {
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    // Animation d'entrée
    setTimeout(() => setIsVisible(true), 50)

    // Timer pour commencer l'animation de sortie
    const timer = setTimeout(() => {
      setIsLeaving(true)
      // Nettoyer l'URL après l'animation
      setTimeout(() => {
        router.replace(`/teams/${teamId}`)
      }, 500)
    }, type === 'success' ? 3000 : 5000)

    return () => clearTimeout(timer)
  }, [router, teamId, type])

  return (
    <div
      style={{ height: isLeaving ? '0' : 'auto' }}
      className={`overflow-hidden transition-all duration-500 ease-in-out ${
        isLeaving ? 'mb-0' : 'mb-6'
      }`}
    >
      <div
        className={`p-4 rounded-lg border shadow-lg transition-all duration-500 ease-in-out transform ${
          isVisible && !isLeaving
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 -translate-y-2 scale-95'
        } ${
          type === 'error'
            ? 'bg-red-50 border-red-200'
            : 'bg-green-50 border-green-200'
        }`}
      >
        <p
          className={`font-medium flex items-center gap-2 ${
            type === 'error' ? 'text-red-800' : 'text-green-800'
          }`}
        >
          <span className="text-xl animate-bounce">
            {type === 'error' ? '❌' : '✓'}
          </span>
          {message}
        </p>
      </div>
    </div>
  )
}
