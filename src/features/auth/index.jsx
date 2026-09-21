import { useState } from 'react'
import { Lock, Store } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function AuthModule() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submitLogin() {
    setError('')

    if (!email.trim() || !password) {
      setError('Completa correo y contraseña.')
      return
    }

    setLoading(true)
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    setLoading(false)

    if (loginError) {
      setError(loginError.message)
    }
  }

  return (
    <section style={{ display: 'grid', placeItems: 'center' }}>
      <div
        style={{
          width: '100%',
          maxWidth: 460,
          background: '#fff',
          borderRadius: 22,
          padding: 24,
          border: '1px solid #e5eaf3',
          boxShadow: '0 16px 36px rgba(23, 32, 51, 0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: 'rgba(47,111,237,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Store size={20} color="#2f6fed" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17 }}>Bazar Central</div>
            <div style={{ fontSize: 12, color: '#5f6b7a' }}>Sistema de punto de venta</div>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="tucorreo@ejemplo.com"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #dfe7f6' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              onKeyDown={(event) => {
                if (event.key === 'Enter') submitLogin()
              }}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #dfe7f6' }}
            />
          </div>

          {error && <div style={{ color: '#e14d5b', fontSize: 12.5 }}>{error}</div>}

          <button
            type="button"
            onClick={submitLogin}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              border: 'none',
              borderRadius: 10,
              padding: '12px 16px',
              background: '#2f6fed',
              color: '#fff',
              fontWeight: 700,
              cursor: loading ? 'default' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            <Lock size={15} /> {loading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </div>
      </div>
    </section>
  )
}
