import { useEffect, useState } from 'react'
import { Bell, Hash, Plus, Save, Store, Tag, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const TABS = [
  { id: 'negocio', label: 'Negocio' },
  { id: 'categorias', label: 'Categorías' },
  { id: 'numeracion', label: 'Numeración' },
]

const DOC_TYPES = [
  { id: 'boleta', label: 'Boleta' },
  { id: 'factura', label: 'Factura' },
]

function docLabel(docType) {
  return DOC_TYPES.find((d) => d.id === docType)?.label || docType
}

function SettingRow({ label, description, children }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 18, padding: '14px 0', borderBottom: '1px solid #edf1f7' }}>
      <div>
        <div style={{ fontWeight: 700, fontSize: 13 }}>{label}</div>
        {description && <div style={{ color: '#5f6b7a', fontSize: 12, marginTop: 4 }}>{description}</div>}
      </div>
      <div style={{ minWidth: 180 }}>{children}</div>
    </div>
  )
}

function fromSettingsRow(row) {
  return {
    businessName: row.business_name || '',
    document: row.document || '',
    phone: row.phone || '',
    address: row.address || '',
    currency: row.currency || 'PEN',
    lowStockAlerts: row.low_stock_alerts,
    receiptMessage: row.receipt_message || '',
    taxEnabled: row.tax_enabled,
  }
}

function toSettingsRow(settings) {
  return {
    business_name: settings.businessName,
    document: settings.document,
    phone: settings.phone,
    address: settings.address,
    currency: settings.currency,
    low_stock_alerts: settings.lowStockAlerts,
    receipt_message: settings.receiptMessage,
    tax_enabled: settings.taxEnabled,
  }
}

function NegocioTab() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    supabase
      .from('business_settings')
      .select('*')
      .eq('id', 1)
      .single()
      .then(({ data, error: fetchError }) => {
        if (!active) return
        if (fetchError) setError(fetchError.message)
        else setSettings(fromSettingsRow(data))
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  function updateField(field, value) {
    setSettings((current) => ({ ...current, [field]: value }))
    setSaved(false)
  }

  async function saveSettings() {
    setSaving(true)
    setError('')

    const { error: updateError } = await supabase
      .from('business_settings')
      .update({ ...toSettingsRow(settings), updated_at: new Date().toISOString() })
      .eq('id', 1)

    setSaving(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setSaved(true)
    window.setTimeout(() => setSaved(false), 2200)
  }

  if (loading) {
    return <div style={{ color: '#5f6b7a', padding: 30, textAlign: 'center' }}>Cargando configuración…</div>
  }

  if (!settings) {
    return <div style={{ color: '#e14d5b', fontSize: 13 }}>{error || 'No se pudo cargar la configuración.'}</div>
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 16 }}>
      {error && <div style={{ color: '#e14d5b', fontSize: 13, gridColumn: '1 / -1' }}>{error}</div>}

      <div style={{ background: '#fff', border: '1px solid #e5eaf3', borderRadius: 18, padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 15, marginBottom: 4 }}><Store size={16} color="#2f6fed" /> Datos del negocio</div>
        <div style={{ color: '#5f6b7a', fontSize: 12, marginBottom: 8 }}>Información que aparecerá en comprobantes y recibos.</div>

        <SettingRow label="Nombre comercial" description="Nombre visible en la aplicación.">
          <input value={settings.businessName} onChange={(event) => updateField('businessName', event.target.value)} style={{ width: '100%', padding: '9px 10px', borderRadius: 9, border: '1px solid #dfe7f6' }} />
        </SettingRow>
        <SettingRow label="RUC o documento">
          <input value={settings.document} onChange={(event) => updateField('document', event.target.value)} placeholder="20600000000" style={{ width: '100%', padding: '9px 10px', borderRadius: 9, border: '1px solid #dfe7f6' }} />
        </SettingRow>
        <SettingRow label="Teléfono">
          <input value={settings.phone} onChange={(event) => updateField('phone', event.target.value)} placeholder="999 999 999" style={{ width: '100%', padding: '9px 10px', borderRadius: 9, border: '1px solid #dfe7f6' }} />
        </SettingRow>
        <SettingRow label="Dirección">
          <input value={settings.address} onChange={(event) => updateField('address', event.target.value)} placeholder="Dirección del negocio" style={{ width: '100%', padding: '9px 10px', borderRadius: 9, border: '1px solid #dfe7f6' }} />
        </SettingRow>
        <SettingRow label="Mensaje del recibo">
          <input value={settings.receiptMessage} onChange={(event) => updateField('receiptMessage', event.target.value)} style={{ width: '100%', padding: '9px 10px', borderRadius: 9, border: '1px solid #dfe7f6' }} />
        </SettingRow>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <button type="button" onClick={saveSettings} disabled={saving} style={{ border: 'none', background: '#2f6fed', color: '#fff', borderRadius: 10, padding: '10px 14px', cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1, display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
            <Save size={15} /> {saving ? 'Guardando…' : saved ? 'Guardado' : 'Guardar cambios'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
        <div style={{ background: '#fff', border: '1px solid #e5eaf3', borderRadius: 18, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 15, marginBottom: 4 }}><Bell size={16} color="#e59a18" /> Preferencias</div>
          <div style={{ color: '#5f6b7a', fontSize: 12, marginBottom: 8 }}>Ajustes del comportamiento del sistema.</div>
          <SettingRow label="Alertas de stock bajo" description="Mostrar productos que requieren reposición.">
            <input type="checkbox" checked={settings.lowStockAlerts} onChange={(event) => updateField('lowStockAlerts', event.target.checked)} style={{ width: 18, height: 18, accentColor: '#2f6fed' }} />
          </SettingRow>
          <SettingRow label="Moneda">
            <select value={settings.currency} onChange={(event) => updateField('currency', event.target.value)} style={{ width: '100%', padding: '9px 10px', borderRadius: 9, border: '1px solid #dfe7f6' }}><option value="PEN">Soles (PEN)</option><option value="USD">Dólares (USD)</option></select>
          </SettingRow>
          <SettingRow label="Impuestos" description="Se activará junto con la facturación electrónica.">
            <input type="checkbox" checked={settings.taxEnabled} onChange={(event) => updateField('taxEnabled', event.target.checked)} style={{ width: 18, height: 18, accentColor: '#2f6fed' }} />
          </SettingRow>
        </div>
      </div>
    </div>
  )
}

function CategoriasTab() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true

    supabase
      .from('categories')
      .select('*')
      .order('name')
      .then(({ data, error: fetchError }) => {
        if (!active) return
        if (fetchError) setError(fetchError.message)
        else setCategories(data || [])
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  async function addCategory() {
    const name = newName.trim()
    if (!name) return

    setSaving(true)
    setError('')

    const { data, error: insertError } = await supabase.from('categories').insert({ name }).select().single()

    setSaving(false)

    if (insertError) {
      setError(insertError.message)
      return
    }

    setCategories((current) => [...current, data].sort((a, b) => a.name.localeCompare(b.name)))
    setNewName('')
  }

  async function deleteCategory(id) {
    setError('')
    const { error: deleteError } = await supabase.from('categories').delete().eq('id', id)
    if (deleteError) {
      setError(deleteError.message)
      return
    }
    setCategories((current) => current.filter((category) => category.id !== id))
  }

  return (
    <div style={{ background: '#fff', border: '1px solid #e5eaf3', borderRadius: 18, padding: 18, maxWidth: 560 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 15, marginBottom: 4 }}><Tag size={16} color="#2f6fed" /> Categorías de producto</div>
      <div style={{ color: '#5f6b7a', fontSize: 12, marginBottom: 12 }}>Se usan en el formulario de Productos. Un producto siempre puede usar una categoría libre además de estas.</div>

      {error && <div style={{ color: '#e14d5b', fontSize: 13, marginBottom: 10 }}>{error}</div>}

      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <input
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          onKeyDown={(event) => { if (event.key === 'Enter') addCategory() }}
          placeholder="Nueva categoría"
          style={{ flex: 1, padding: '9px 10px', borderRadius: 9, border: '1px solid #dfe7f6' }}
        />
        <button type="button" onClick={addCategory} disabled={!newName.trim() || saving} style={{ border: 'none', background: newName.trim() ? '#2f6fed' : '#dfe7f6', color: newName.trim() ? '#fff' : '#5f6b7a', borderRadius: 9, padding: '9px 14px', cursor: newName.trim() ? 'pointer' : 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
          <Plus size={15} /> Agregar
        </button>
      </div>

      {loading && <div style={{ color: '#5f6b7a', textAlign: 'center', padding: 20 }}>Cargando categorías…</div>}

      {!loading && (
        <div style={{ display: 'grid', gap: 6 }}>
          {categories.map((category) => (
            <div key={category.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px', border: '1px solid #edf1f7', borderRadius: 10 }}>
              <span style={{ fontWeight: 600, fontSize: 13.5 }}>{category.name}</span>
              <button type="button" onClick={() => deleteCategory(category.id)} aria-label={`Eliminar categoría ${category.name}`} style={{ border: '1px solid #f5d2d7', background: '#fff', borderRadius: 8, padding: 6, color: '#d9534f', cursor: 'pointer' }}>
                <Trash2 size={13} />
              </button>
            </div>
          ))}
          {categories.length === 0 && <div style={{ color: '#5f6b7a', textAlign: 'center', padding: 20, fontSize: 13 }}>No hay categorías registradas.</div>}
        </div>
      )}
    </div>
  )
}

function NumeracionTab() {
  const [series, setSeries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newDocType, setNewDocType] = useState('boleta')
  const [newSeries, setNewSeries] = useState('')
  const [newNextNumber, setNewNextNumber] = useState(1)
  const [saving, setSaving] = useState(false)
  const [editedNumbers, setEditedNumbers] = useState({})

  useEffect(() => {
    let active = true

    supabase
      .from('document_series')
      .select('*')
      .order('doc_type')
      .order('series')
      .then(({ data, error: fetchError }) => {
        if (!active) return
        if (fetchError) setError(fetchError.message)
        else setSeries(data || [])
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  async function addSeries() {
    const seriesName = newSeries.trim()
    if (!seriesName) return

    setSaving(true)
    setError('')

    const { data, error: insertError } = await supabase
      .from('document_series')
      .insert({ doc_type: newDocType, series: seriesName, next_number: Number(newNextNumber) || 1 })
      .select()
      .single()

    setSaving(false)

    if (insertError) {
      setError(insertError.message)
      return
    }

    setSeries((current) => [...current, data])
    setNewSeries('')
    setNewNextNumber(1)
  }

  async function saveNextNumber(row) {
    const value = Number(editedNumbers[row.id])
    if (!Number.isFinite(value) || value < 1) return

    setError('')
    const { error: updateError } = await supabase.from('document_series').update({ next_number: value }).eq('id', row.id)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setSeries((current) => current.map((item) => (item.id === row.id ? { ...item, next_number: value } : item)))
    setEditedNumbers((current) => {
      const next = { ...current }
      delete next[row.id]
      return next
    })
  }

  return (
    <div style={{ background: '#fff', border: '1px solid #e5eaf3', borderRadius: 18, padding: 18, maxWidth: 640 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 15, marginBottom: 4 }}><Hash size={16} color="#2f6fed" /> Numeración de boletas y facturas</div>
      <div style={{ color: '#5f6b7a', fontSize: 12, marginBottom: 12 }}>Series y correlativos propios del negocio, listos para cuando se active la facturación electrónica. Todavía no se usan para emitir documentos.</div>

      {error && <div style={{ color: '#e14d5b', fontSize: 13, marginBottom: 10 }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 8, marginBottom: 14 }}>
        <select value={newDocType} onChange={(event) => setNewDocType(event.target.value)} style={{ padding: '9px 10px', borderRadius: 9, border: '1px solid #dfe7f6' }}>
          {DOC_TYPES.map((type) => <option key={type.id} value={type.id}>{type.label}</option>)}
        </select>
        <input value={newSeries} onChange={(event) => setNewSeries(event.target.value)} placeholder="Serie, ej. B001" style={{ padding: '9px 10px', borderRadius: 9, border: '1px solid #dfe7f6' }} />
        <input type="number" min="1" value={newNextNumber} onChange={(event) => setNewNextNumber(event.target.value)} placeholder="Número inicial" style={{ padding: '9px 10px', borderRadius: 9, border: '1px solid #dfe7f6' }} />
        <button type="button" onClick={addSeries} disabled={!newSeries.trim() || saving} aria-label="Agregar serie" style={{ border: 'none', background: newSeries.trim() ? '#2f6fed' : '#dfe7f6', color: newSeries.trim() ? '#fff' : '#5f6b7a', borderRadius: 9, padding: '9px 14px', cursor: newSeries.trim() ? 'pointer' : 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
          <Plus size={15} />
        </button>
      </div>

      {loading && <div style={{ color: '#5f6b7a', textAlign: 'center', padding: 20 }}>Cargando series…</div>}

      {!loading && (
        <div style={{ display: 'grid', gap: 6 }}>
          {series.map((row) => {
            const edited = editedNumbers[row.id]
            const hasEdit = edited !== undefined && Number(edited) !== row.next_number

            return (
              <div key={row.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '9px 12px', border: '1px solid #edf1f7', borderRadius: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ background: '#edf3ff', color: '#2f6fed', borderRadius: 999, padding: '4px 9px', fontSize: 11, fontWeight: 700 }}>{docLabel(row.doc_type)}</span>
                  <span style={{ fontWeight: 700, fontSize: 13.5 }}>{row.series}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#5f6b7a', fontSize: 12 }}>Próximo número</span>
                  <input
                    type="number"
                    min="1"
                    value={edited !== undefined ? edited : row.next_number}
                    onChange={(event) => setEditedNumbers((current) => ({ ...current, [row.id]: event.target.value }))}
                    style={{ width: 80, padding: '6px 8px', borderRadius: 8, border: '1px solid #dfe7f6' }}
                  />
                  {hasEdit && (
                    <button type="button" onClick={() => saveNextNumber(row)} style={{ border: 'none', background: '#2f6fed', color: '#fff', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>
                      Guardar
                    </button>
                  )}
                </div>
              </div>
            )
          })}
          {series.length === 0 && <div style={{ color: '#5f6b7a', textAlign: 'center', padding: 20, fontSize: 13 }}>No hay series registradas.</div>}
        </div>
      )}
    </div>
  )
}

export default function MantenimientoModule() {
  const [tab, setTab] = useState('negocio')

  return (
    <section style={{ display: 'grid', gap: 18 }}>
      <div style={{ display: 'flex', gap: 8, background: '#eef3ff', borderRadius: 12, padding: 6, maxWidth: 420 }}>
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            style={{
              flex: 1,
              border: 'none',
              borderRadius: 10,
              padding: '10px 12px',
              background: tab === item.id ? '#fff' : 'transparent',
              color: '#172033',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'negocio' && <NegocioTab />}
      {tab === 'categorias' && <CategoriasTab />}
      {tab === 'numeracion' && <NumeracionTab />}
    </section>
  )
}
