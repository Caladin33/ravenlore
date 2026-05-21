import { useState } from 'react'
import { supabase } from '../supabase'

export default function Auth({ onAuth }) {
  const [mode, setMode] = useState('login') // 'login' | 'signup' | 'reset'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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

  const handleReset = async () => {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    })
    if (error) {
      setError(error.message)
    } else {
      setMessage('Password reset email sent! Check your inbox.')
    }
    setLoading(false)
  }

  const switchMode = (m) => {
    setMode(m)
    setError('')
    setMessage('')
    setShowPassword(false)
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
    width: '100%', boxSizing: 'border-box',
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

        {/* Mode tabs — only login/signup, not reset */}
        {mode !== 'reset' && (
          <div style={{ display: 'flex', gap: 8 }}>
            {['login', 'signup'].map(m => (
              <button
                key={m}
                onClick={() => switchMode(m)}
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
        )}

        {/* Reset password header */}
        {mode === 'reset' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: 'var(--gold)', fontFamily: 'Georgia, serif', fontSize: '1rem', letterSpacing: '.08em', marginBottom: 4 }}>
              Reset Password
            </div>
            <div style={{ color: 'var(--text3)', fontSize: '.8rem', fontFamily: 'Georgia, serif' }}>
              Enter your email and we'll send a reset link.
            </div>
          </div>
        )}

        {/* Username — signup only */}
        {mode === 'signup' && (
          <input
            style={input} placeholder="Username"
            value={username} onChange={e => setUsername(e.target.value)}
          />
        )}

        {/* Email */}
        <input
          style={input} placeholder="Email"
          type="email" value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => mode === 'reset' && e.key === 'Enter' && handleReset()}
        />

        {/* Password with show/hide toggle */}
        {mode !== 'reset' && (
          <div style={{ position: 'relative' }}>
            <input
              style={{ ...input, paddingRight: 44 }}
              placeholder="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleSignup())}
            />
            <button
              onClick={() => setShowPassword(v => !v)}
              tabIndex={-1}
              style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text3)', fontSize: '.85rem', padding: '4px',
                fontFamily: 'Georgia, serif', letterSpacing: '.04em',
              }}
            >
              {showPassword ? 'hide' : 'show'}
            </button>
          </div>
        )}

        {/* Forgot password link — login mode only */}
        {mode === 'login' && (
          <div style={{ textAlign: 'right', marginTop: -8 }}>
            <button
              onClick={() => switchMode('reset')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text3)', fontFamily: 'Georgia, serif',
                fontSize: '.78rem', textDecoration: 'underline',
                textUnderlineOffset: 2, padding: 0,
              }}
            >
              Forgot password?
            </button>
          </div>
        )}

        {/* Error / success messages */}
        {error && (
          <div style={{ color: '#c94a4a', fontSize: '.85rem' }}>⚠ {error}</div>
        )}
        {message && (
          <div style={{ color: '#4a9e4a', fontSize: '.85rem' }}>✓ {message}</div>
        )}

        {/* Primary action button */}
        <button
          style={btn}
          onClick={mode === 'login' ? handleLogin : mode === 'signup' ? handleSignup : handleReset}
          disabled={loading}
        >
          {loading ? 'Please wait...' : mode === 'login' ? 'Log In' : mode === 'signup' ? 'Create Account' : 'Send Reset Email'}
        </button>

        {/* Back to login — reset mode only */}
        {mode === 'reset' && (
          <button
            onClick={() => switchMode('login')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text3)', fontFamily: 'Georgia, serif',
              fontSize: '.82rem', textDecoration: 'underline',
              textUnderlineOffset: 2, padding: 0, textAlign: 'center',
            }}
          >
            ← Back to Log In
          </button>
        )}

      </div>
    </div>
  )
}
