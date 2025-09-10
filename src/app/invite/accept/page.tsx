"use client"
import { useEffect, useState } from 'react'

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
    <div style={{ maxWidth: 520, margin: '40px auto', padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 12 }}>Accept Invite</h1>
      {status === 'idle' || status === 'working' ? (
        <p>Processing your invite...</p>
      ) : null}
      {status === 'success' ? (
        <p style={{ color: 'green' }}>{message}</p>
      ) : null}
      {status === 'error' ? (
        <p style={{ color: 'crimson' }}>{message}</p>
      ) : null}
    </div>
  )
}
