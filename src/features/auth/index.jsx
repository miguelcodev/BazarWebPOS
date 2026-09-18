import { useEffect, useState } from 'react'
import { Lock, Store, UserPlus } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function AuthModule() {
  const [tab, setTab] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [profileId, setProfileId] = useState('')
  const [password2, setPassword2] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [profiles, setProfiles] = useState([])

  useEffect(() => {
    supabase
      .from('profiles')
      .select('id, name')
      .order('name')
      .then(({ data, error: profilesError }) => {
        if (profilesError) return
        setProfiles(data || [])
        setProfileId((current) => current || data?.[0]?.id || '')
      })
  }, [])

  async function submitLogin() {
    setError('')
    setMessage('')

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

  async function submitRegister() {
    setError('')
    setMessage('')

    if (!name.trim() || !email.trim() || !password) {
      setError('Completa nombre, correo y contraseña.')
      return
    }

    if (password !== password2) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    const { data, error: registerError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          name: name.trim(),
          phone: phone.trim(),
          profile_id: profileId || null,
        },
      },
    })
    setLoading(false)

    if (registerError) {
      setError(registerError.message)
      return
    }

    setName('')
    setEmail('')
    setPhone('')
    setPassword('')
    setPassword2('')

    if (data.session) {
      return
    }

    setTab('login')
    setMessage('Cuenta creada. Revisa tu correo para confirmarla antes de iniciar sesión.')
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

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
            background: '#eef3ff',
            borderRadius: 12,
            padding: 6,
            marginBottom: 18,
          }}
        >
          <button
            type="button"
            onClick={() => {
              setTab('login')
              setError('')
              setMessage('')
            }}
            style={{
              border: 'none',
              borderRadius: 10,
              padding: '10px 12px',
              background: tab === 'login' ? '#fff' : 'transparent',
              color: '#172033',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('register')
              setError('')
              setMessage('')
            }}
            style={{
              border: 'none',
              borderRadius: 10,
              padding: '10px 12px',
              background: tab === 'register' ? '#fff' : 'transparent',
              color: '#172033',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Crear cuenta
          </button>
        </div>

        {tab === 'login' ? (
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
            {message && <div style={{ color: '#1ea97c', fontSize: 12.5 }}>{message}</div>}

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
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Nombre completo</label>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Tu nombre"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #dfe7f6' }}
              />
            </div>

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
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Teléfono</label>
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Opcional"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #dfe7f6' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Perfil</label>
              <select
                value={profileId}
                onChange={(event) => setProfileId(event.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #dfe7f6' }}
              >
                {profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>{profile.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #dfe7f6' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Confirmar</label>
                <input
                  type="password"
                  value={password2}
                  onChange={(event) => setPassword2(event.target.value)}
                  placeholder="••••••••"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #dfe7f6' }}
                />
              </div>
            </div>

            {error && <div style={{ color: '#e14d5b', fontSize: 12.5 }}>{error}</div>}
            {message && <div style={{ color: '#1ea97c', fontSize: 12.5 }}>{message}</div>}

            <button
              type="button"
              onClick={submitRegister}
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
              <UserPlus size={15} /> {loading ? 'Creando…' : 'Crear cuenta'}
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
