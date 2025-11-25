'use client'

import { Button } from '@/components/ui/button'
import { useState } from 'react'

interface MessageFormProps {
  sendMessage: (formData: FormData) => Promise<void>
}

export function MessageForm({ sendMessage }: MessageFormProps) {
  const [content, setContent] = useState('')
  const [subject, setSubject] = useState('')
  const [sending, setSending] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    
    if (!content.trim() || sending) return

    setSending(true)
    
    const formData = new FormData()
    formData.set('content', content)
    if (subject.trim()) {
      formData.set('subject', subject)
    }

    try {
      await sendMessage(formData)
      setContent('')
      setSubject('')
    } finally {
      setSending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-4">
      <div className="space-y-3">
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Sujet (optionnel)"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
          disabled={sending}
        />
        
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Écrivez votre message..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          disabled={sending}
          required
        />

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={!content.trim() || sending}
            className="bg-primary-600 hover:bg-primary-700"
          >
            {sending ? 'Envoi...' : 'Envoyer'}
          </Button>
        </div>
      </div>
    </form>
  )
}
