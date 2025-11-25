'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'

interface StaffReplyFormProps {
  conversationId: string
  action: (formData: FormData) => Promise<void>
}

export function StaffReplyForm({ conversationId, action }: StaffReplyFormProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isTyping, setIsTyping] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  const handleTyping = () => {
    console.log('⌨️ STAFF handleTyping called')
    if (!isTyping) {
      setIsTyping(true)
      console.log('📤 STAFF Sending typing=true to API')
      fetch(`/api/staff-conversations/${conversationId}/typing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isTyping: true }),
      }).then(r => console.log('✅ STAFF API response:', r.status))
    }

    // Reset le timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Après 2 secondes d'inactivité, marquer comme "pas en train de taper"
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      fetch(`/api/staff-conversations/${conversationId}/typing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isTyping: false }),
      })
    }, 2000)
  }

  const handleSubmit = async (formData: FormData) => {
    // Annuler l'indicateur de saisie
    setIsTyping(false)
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    fetch(`/api/staff-conversations/${conversationId}/typing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isTyping: false }),
    })

    await action(formData)
    formRef.current?.reset()
    if (textareaRef.current) {
      textareaRef.current.value = ''
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      const form = formRef.current
      if (form && textareaRef.current?.value.trim()) {
        const formData = new FormData(form)
        handleSubmit(formData)
      }
    }
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-4">
      <input type="hidden" name="conversationId" value={conversationId} />
      <textarea
        ref={textareaRef}
        name="content"
        rows={4}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        placeholder="Écrivez votre réponse... (Entrée pour envoyer, Maj+Entrée pour nouvelle ligne)"
        required
        onChange={handleTyping}
        onKeyDown={handleKeyDown}
      />
      <div className="flex justify-end gap-2">
        <Button type="submit">Envoyer</Button>
      </div>
    </form>
  )
}
