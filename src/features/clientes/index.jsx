import { useEffect, useMemo, useState } from 'react'
import { BookUser, CreditCard, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'

function emptyClient() {
  return { id: null, name: '', document: '', phone: '', email: '', address: '', credit: 0, status: 'Activo' }
}

function fromRow(row) {
  return {
    id: row.id,
    name: row.name,
    document: row.doc || '',
    phone: row.phone || '',
    email: row.email || '',
    address: row.address || '',
    credit: row.credit,
    status: row.status || 'Activo',
  }
}

function toRow(client) {
  return {
    name: client.name,
    doc: client.document,
    phone: client.phone,
    email: client.email,
    address: client.address,
    credit: Number(client.credit) || 0,
    status: client.status || 'Activo',
  }
}

function ClientForm({ initial, onCancel, onSave, saving }) {
  const [form, setForm] = useState(initial)
  const setField = (key) => (event) => setForm({ ...form, [key]: event.target.value })

  function handleSave() {
    if (!form.name.trim()) return
    onSave({ ...form, name: form.name.trim() })
  }

  return (
    <div onClick={onCancel} style={{ position: 'fixed', inset: 0, background: 'rgba(23,32,51,0.4)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div onClick={(event) => event.stopPropagation()} style={{ width: '100%', maxWidth: 560, background: '#fff', borderRadius: 18, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontWeight: 800, fontSize: 16 }}>{form.id ? 'Editar cliente' : 'Nuevo cliente'}</div>
          <button type="button" onClick={onCancel} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}><X size={16} /></button>
        </div>

        <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Nombre o razón social</label>
        <input value={form.name} onChange={setField('name')} placeholder="Ej. María Torres" style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #dfe7f6', marginBottom: 10 }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Documento</label>
            <input value={form.document} onChange={setField('document')} placeholder="DNI o RUC" style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #dfe7f6' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Teléfono</label>
            <input value={form.phone} onChange={setField('phone')} placeholder="999 999 999" style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #dfe7f6' }} />
          </div>
        </div>

        <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Correo electrónico</label>
        <input type="email" value={form.email} onChange={setField('email')} placeholder="cliente@correo.com" style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #dfe7f6', marginBottom: 10 }} />

        <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Dirección</label>
        <input value={form.address} onChange={setField('address')} placeholder="Dirección del cliente" style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #dfe7f6', marginBottom: 10 }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Saldo pendiente</label>
            <input type="number" min="0" value={form.credit} onChange={setField('credit')} placeholder="0.00" style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #dfe7f6' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Estado</label>
            <select value={form.status} onChange={setField('status')} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #dfe7f6' }}>
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" onClick={onCancel} style={{ flex: 1, border: '1px solid #dfe7f6', background: '#fff', borderRadius: 10, padding: '10px 12px', cursor: 'pointer', fontWeight: 700 }}>Cancelar</button>
          <button type="button" onClick={handleSave} disabled={!form.name.trim() || saving} style={{ flex: 1, border: 'none', background: form.name.trim() ? '#2f6fed' : '#dfe7f6', color: form.name.trim() ? '#fff' : '#5f6b7a', borderRadius: 10, padding: '10px 12px', cursor: form.name.trim() && !saving ? 'pointer' : 'not-allowed', fontWeight: 700, opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Guardando…' : 'Guardar cliente'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ClientesModule() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true

    supabase
      .from('customers')
      .select('*')
      .order('name')
      .then(({ data, error: fetchError }) => {
        if (!active) return
        if (fetchError) {
          setError(fetchError.message)
        } else {
          setClients((data || []).map(fromRow))
        }
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const filtered = useMemo(() => clients.filter((client) =>
    `${client.name} ${client.document} ${client.phone}`.toLowerCase().includes(query.toLowerCase()),
  ), [clients, query])

  const activeCount = clients.filter((client) => client.status === 'Activo').length
  const creditTotal = clients.reduce((total, client) => total + Number(client.credit || 0), 0)

  async function handleSave(client) {
    setSaving(true)
    setError('')

    if (client.id) {
      const { data, error: updateError } = await supabase
        .from('customers')
        .update(toRow(client))
        .eq('id', client.id)
        .select()
        .single()

      setSaving(false)
      if (updateError) {
        setError(updateError.message)
        return
      }
      setClients((current) => current.map((item) => (item.id === client.id ? fromRow(data) : item)))
    } else {
      const { data, error: insertError } = await supabase
        .from('customers')
        .insert(toRow(client))
        .select()
        .single()

      setSaving(false)
      if (insertError) {
        setError(insertError.message)
        return
      }
      setClients((current) => [fromRow(data), ...current])
    }

    setEditing(null)
  }

  async function handleDelete(clientId) {
    setError('')
    const { error: deleteError } = await supabase.from('customers').delete().eq('id', clientId)
    if (deleteError) {
      setError(deleteError.message)
      return
    }
    setClients((current) => current.filter((client) => client.id !== clientId))
  }

  return (
    <section style={{ display: 'grid', gap: 18 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        <div style={{ background: '#fff', border: '1px solid #e5eaf3', borderRadius: 18, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#5f6b7a', fontSize: 12, marginBottom: 8 }}><span>Clientes registrados</span><BookUser size={16} color="#2f6fed" /></div>
          <div style={{ fontWeight: 800, fontSize: 26 }}>{clients.length}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e5eaf3', borderRadius: 18, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#5f6b7a', fontSize: 12, marginBottom: 8 }}><span>Clientes activos</span><BookUser size={16} color="#1ea97c" /></div>
          <div style={{ fontWeight: 800, fontSize: 26 }}>{activeCount}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e5eaf3', borderRadius: 18, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#5f6b7a', fontSize: 12, marginBottom: 8 }}><span>Saldo pendiente</span><CreditCard size={16} color="#d48b00" /></div>
          <div style={{ fontWeight: 800, fontSize: 26 }}>S/ {creditTotal.toFixed(2)}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#5f6b7a' }} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar nombre, documento o teléfono…" style={{ width: '100%', padding: '10px 12px 10px 34px', borderRadius: 10, border: '1px solid #dfe7f6' }} />
        </div>
        <button type="button" onClick={() => setEditing(emptyClient())} style={{ border: 'none', background: '#2f6fed', color: '#fff', borderRadius: 10, padding: '10px 14px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 700 }}><Plus size={16} /> Nuevo cliente</button>
      </div>

      {error && <div style={{ color: '#e14d5b', fontSize: 13 }}>{error}</div>}

      <div style={{ background: '#fff', border: '1px solid #e5eaf3', borderRadius: 18, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f7f9fd' }}><tr>
            <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: 12, color: '#5f6b7a' }}>Cliente</th>
            <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: 12, color: '#5f6b7a' }}>Documento</th>
            <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: 12, color: '#5f6b7a' }}>Contacto</th>
            <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: 12, color: '#5f6b7a' }}>Saldo</th>
            <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: 12, color: '#5f6b7a' }}>Estado</th>
            <th style={{ textAlign: 'right', padding: '14px 16px', fontSize: 12, color: '#5f6b7a' }}></th>
          </tr></thead>
          <tbody>
            {loading && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 30, color: '#5f6b7a' }}>Cargando clientes…</td></tr>}

            {!loading && filtered.map((client) => <tr key={client.id} style={{ borderTop: '1px solid #edf1f7' }}>
              <td style={{ padding: '14px 16px' }}><div style={{ fontWeight: 700 }}>{client.name}</div><div style={{ fontSize: 11.5, color: '#5f6b7a' }}>{client.address || 'Sin dirección'}</div></td>
              <td style={{ padding: '14px 16px', color: '#5f6b7a' }}>{client.document || 'Sin documento'}</td>
              <td style={{ padding: '14px 16px' }}><div>{client.phone || 'Sin teléfono'}</div><div style={{ fontSize: 11.5, color: '#5f6b7a' }}>{client.email || 'Sin correo'}</div></td>
              <td style={{ padding: '14px 16px', fontWeight: client.credit > 0 ? 700 : 400, color: client.credit > 0 ? '#c93d4e' : '#172033' }}>S/ {Number(client.credit).toFixed(2)}</td>
              <td style={{ padding: '14px 16px' }}><span style={{ background: client.status === 'Activo' ? '#edf7f1' : '#f1f3f6', color: client.status === 'Activo' ? '#1ea97c' : '#5f6b7a', borderRadius: 999, padding: '5px 10px', fontSize: 11, fontWeight: 700 }}>{client.status}</span></td>
              <td style={{ padding: '14px 16px', textAlign: 'right' }}><div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                <button type="button" onClick={() => setEditing(client)} aria-label={`Editar ${client.name}`} style={{ border: '1px solid #dfe7f6', background: '#fff', borderRadius: 8, padding: 6, cursor: 'pointer' }}><Pencil size={14} /></button>
                <button type="button" onClick={() => handleDelete(client.id)} aria-label={`Eliminar ${client.name}`} style={{ border: '1px solid #f5d2d7', background: '#fff', borderRadius: 8, padding: 6, color: '#d9534f', cursor: 'pointer' }}><Trash2 size={14} /></button>
              </div></td>
            </tr>)}
            {!loading && filtered.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 30, color: '#5f6b7a' }}>No hay clientes.</td></tr>}
          </tbody>
        </table>
      </div>

      {editing && <ClientForm initial={editing} saving={saving} onCancel={() => setEditing(null)} onSave={handleSave} />}
    </section>
  )
}
