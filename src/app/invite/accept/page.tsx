"use client"
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { layout, typography } from '@/lib/component-utils'

export default function AcceptInvitePage() {
  const [status, setStatus] = useState<'idle'|'working'|'success'|'error'>('idle')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const url = new URL(window.location.href)
    const token = url.searchParams.get('token')
    if (!token) {
      setStatus('error')
      setMessage('Missing invite token in URL')
      return
    }
    const accept = async () => {
      setStatus('working')
      try {
        const res = await fetch('/api/invites/accept', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ token }),
        })
        const body = await res.json().catch(() => ({}))
        if (!res.ok || !body?.accepted) {
          setStatus('error')
          setMessage(body?.error || 'Failed to accept invite. Make sure you are logged in with the invited email.')
          return
        }
        setStatus('success')
        setMessage('Invite accepted! You now have access to the world.')
      } catch (err) {
        setStatus('error')
        setMessage(String((err as Error)?.message || err))
      }
    }
    accept()
  }, [])

  return (
    <div className={layout.containerSmall}>
      <div className="py-10">
        <Card className="max-w-lg mx-auto">
          <h1 className={`${typography.h2} mb-6`}>Accept Invite</h1>

          {status === 'idle' || status === 'working' ? (
            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand-600"></div>
              <p>Processing your invite...</p>
            </div>
          ) : null}

          {status === 'success' && (
            <Alert variant="success" className="mt-4">
              <p>{message}</p>
            </Alert>
          )}

          {status === 'error' && (
            <Alert variant="error" className="mt-4">
              <p>{message}</p>
            </Alert>
          )}
        </Card>
      </div>
    </div>
  )
}
