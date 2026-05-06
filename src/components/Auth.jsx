import { useState } from 'react'
import { supabase } from '../supabase'

export default function Auth({ onAuth }) {
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
    } else {
      onAuth(data.user)
    }
    setLoading(false)
  }

  const handleSignup = async () => {
    setLoading(true)
    setError('')
    if (!username.trim()) {
      setError('Please enter a username.')
      setLoading(false)
      return
    }
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    if (data.user) {
  setMessage('Account created! You are now logged in.')
  onAuth(data.user)
}
    setLoading(false)
  }

  const box = {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 8, padding: '32px 36px',
    display: 'flex', flexDirection: 'column', gap: 16,
    width: '100%', maxWidth: 400,
  }

  const input = {
    padding: '10px 14px', background: 'var(--bg2)',
    border: '1px solid var(--border)', color: 'var(--text)',
    borderRadius: 5, fontFamily: 'Georgia, serif', fontSize: '1rem',
    width: '100%',
  }

  const btn = {
    padding: '10px 0', borderRadius: 5, cursor: 'pointer',
    fontFamily: 'Georgia, serif', fontSize: '1rem', width: '100%',
    background: 'rgba(201,168,76,.15)', border: '1px solid var(--gold)',
    color: 'var(--gold2)',
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', gap: 24, padding: 20,
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ color: 'var(--gold2)', fontSize: '2.5rem', letterSpacing: '.1em', margin: 0 }}>
          RavenLore
        </h1>
        <div style={{ color: 'var(--text3)', fontSize: '.75rem', letterSpacing: '.2em', textTransform: 'uppercase', marginTop: 6 }}>
          Character Management System
        </div>
      </div>

      <div style={box}>
        <div style={{ display: 'flex', gap: 8 }}>
          {['login', 'signup'].map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); setMessage('') }}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 4, cursor: 'pointer',
                fontFamily: 'Georgia, serif', fontSize: '.9rem',
                background: mode === m ? 'rgba(201,168,76,.15)' : 'var(--bg2)',
                border: `1px solid ${mode === m ? 'var(--gold)' : 'var(--border)'}`,
                color: mode === m ? 'var(--gold2)' : 'var(--text3)',
              }}
            >
              {m === 'login' ? 'Log In' : 'Sign Up'}
            </button>
          ))}
        </div>

        {mode === 'signup' && (
          <input
            style={input} placeholder="Username"
            value={username} onChange={e => setUsername(e.target.value)}
          />
        )}

        <input
          style={input} placeholder="Email"
          type="email" value={email}
          onChange={e => setEmail(e.target.value)}
        />

        <input
          style={input} placeholder="Password"
          type="password" value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleSignup())}
        />

        {error && (
          <div style={{ color: '#c94a4a', fontSize: '.85rem' }}>⚠ {error}</div>
        )}
        {message && (
          <div style={{ color: '#4a9e4a', fontSize: '.85rem' }}>✓ {message}</div>
        )}

        <button
          style={btn}
          onClick={mode === 'login' ? handleLogin : handleSignup}
          disabled={loading}
        >
          {loading ? 'Please wait...' : (mode === 'login' ? 'Log In' : 'Create Account')}
        </button>
      </div>
    </div>
  )
}
