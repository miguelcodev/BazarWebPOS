import { useEffect, useMemo, useState } from 'react'
import { ArrowDownCircle, ArrowUpCircle, History, Search, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { unitShort, fromProductRow } from '../../lib/products'

const MOVEMENT_LABELS = {
  venta: 'Venta',
  ingreso: 'Ingreso',
  entrada: 'Entrada manual',
  salida: 'Salida manual',
  ajuste: 'Ajuste',
  inicial: 'Stock inicial',
  anulacion: 'Anulación de venta',
}

function MovementsModal({ product, movements, loading, error, onClose }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(23,32,51,0.4)', display: 'grid', placeItems: 'center', padding: 20, zIndex: 50 }}>
      <div onClick={(event) => event.stopPropagation()} style={{ width: '100%', maxWidth: 480, maxHeight: '80vh', display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: 18, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>Movimientos de stock</div>
            <div style={{ color: '#5f6b7a', fontSize: 13 }}>{product.name} · stock actual {product.stock} {unitShort(product)}</div>
          </div>
          <button type="button" onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#5f6b7a', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ marginTop: 12, overflowY: 'auto', flex: 1 }}>
          {loading && <div style={{ textAlign: 'center', padding: 24, color: '#5f6b7a' }}>Cargando movimientos…</div>}
          {!loading && error && <div style={{ color: '#e14d5b', fontSize: 13, padding: '8px 0' }}>{error}</div>}
          {!loading && !error && movements.length === 0 && (
            <div style={{ textAlign: 'center', padding: 24, color: '#5f6b7a' }}>Sin movimientos registrados.</div>
          )}

          {!loading && !error && movements.length > 0 && (
            <div style={{ display: 'grid', gap: 8 }}>
              {movements.map((movement) => {
                const positive = movement.quantity > 0
                return (
                  <div
                    key={movement.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 10,
                      border: '1px solid #edf1f7',
                      borderRadius: 12,
                      padding: '10px 12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {positive ? (
                        <ArrowUpCircle size={18} color="#1ea97c" />
                      ) : (
                        <ArrowDownCircle size={18} color="#e14d5b" />
                      )}
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{MOVEMENT_LABELS[movement.type] || movement.type}</div>
                        <div style={{ fontSize: 12, color: '#5f6b7a' }}>
                          {new Date(movement.created_at).toLocaleString('es-PE')}
                          {movement.app_users?.name ? ` · ${movement.app_users.name}` : ''}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontWeight: 800, color: positive ? '#1ea97c' : '#e14d5b' }}>
                      {positive ? '+' : ''}{movement.quantity}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function AdjustModal({ product, onCancel, onConfirm, saving }) {
  const [type, setType] = useState('entrada')
  const [qty, setQty] = useState('')

  return (
    <div onClick={onCancel} style={{ position: 'fixed', inset: 0, background: 'rgba(23,32,51,0.4)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div onClick={(event) => event.stopPropagation()} style={{ width: '100%', maxWidth: 360, background: '#fff', borderRadius: 18, padding: 20 }}>
        <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>Ajustar stock</div>
        <div style={{ color: '#5f6b7a', fontSize: 13, marginBottom: 16 }}>{product.name} · stock actual {product.stock}</div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button
            type="button"
            onClick={() => setType('entrada')}
            style={{
              flex: 1,
              border: '1px solid #dfe7f6',
              background: type === 'entrada' ? 'rgba(47,111,237,0.12)' : '#fff',
              color: type === 'entrada' ? '#2f6fed' : '#172033',
              borderRadius: 10,
              padding: '10px 12px',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            <ArrowUpCircle size={15} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Entrada
          </button>

          <button
            type="button"
            onClick={() => setType('salida')}
            style={{
              flex: 1,
              border: '1px solid #dfe7f6',
              background: type === 'salida' ? 'rgba(225,77,91,0.12)' : '#fff',
              color: type === 'salida' ? '#e14d5b' : '#172033',
              borderRadius: 10,
              padding: '10px 12px',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            <ArrowDownCircle size={15} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Salida
          </button>
        </div>

        <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Cantidad</label>
        <input
          type="number"
          value={qty}
          onChange={(event) => setQty(event.target.value)}
          placeholder="0"
          style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #dfe7f6', marginBottom: 18 }}
        />

        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" onClick={onCancel} style={{ flex: 1, border: '1px solid #dfe7f6', background: '#fff', borderRadius: 10, padding: '10px 12px', fontWeight: 700, cursor: 'pointer' }}>
            Cancelar
          </button>
          <button
            type="button"
            disabled={!qty || Number(qty) <= 0 || saving}
            onClick={() => onConfirm(type === 'entrada' ? Number(qty) : -Number(qty), type)}
            style={{
              flex: 1,
              border: 'none',
              background: !qty || Number(qty) <= 0 ? '#dfe7f6' : '#2f6fed',
              color: !qty || Number(qty) <= 0 ? '#5f6b7a' : '#fff',
              borderRadius: 10,
              padding: '10px 12px',
              fontWeight: 700,
              cursor: !qty || Number(qty) <= 0 || saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Guardando…' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function InventarioModule() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [adjusting, setAdjusting] = useState(null)
  const [saving, setSaving] = useState(false)
  const [viewingMovements, setViewingMovements] = useState(null)
  const [movements, setMovements] = useState([])
  const [movementsLoading, setMovementsLoading] = useState(false)
  const [movementsError, setMovementsError] = useState('')

  useEffect(() => {
    let active = true

    supabase
      .from('products')
      .select('*')
      .order('name')
      .then(({ data, error: fetchError }) => {
        if (!active) return
        if (fetchError) setError(fetchError.message)
        else setProducts((data || []).map(fromProductRow))
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const categories = useMemo(
    () => [...new Set(products.map((product) => product.category).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [products],
  )

  const sorted = useMemo(() => {
    const term = query.trim().toLowerCase()

    return products
      .filter((product) => !term || product.name.toLowerCase().includes(term))
      .filter((product) => !categoryFilter || product.category === categoryFilter)
      .sort((a, b) => (a.stock <= a.minStock ? -1 : 1) - (b.stock <= b.minStock ? -1 : 1))
  }, [products, query, categoryFilter])

  async function handleAdjust(productId, delta, type) {
    setSaving(true)
    setError('')

    const { error: adjustError } = await supabase.rpc('adjust_stock', {
      payload: { product_id: productId, delta, type },
    })

    setSaving(false)

    if (adjustError) {
      setError(adjustError.message)
      return
    }

    setProducts((current) =>
      current.map((product) =>
        product.id === productId
          ? { ...product, stock: Math.max(0, product.stock + delta) }
          : product,
      ),
    )
    setAdjusting(null)
  }

  async function handleViewMovements(product) {
    setViewingMovements(product)
    setMovements([])
    setMovementsError('')
    setMovementsLoading(true)

    const { data, error: fetchError } = await supabase
      .from('stock_movements')
      .select('id, type, quantity, created_at, app_users(name)')
      .eq('product_id', product.id)
      .order('created_at', { ascending: false })

    setMovementsLoading(false)

    if (fetchError) setMovementsError(fetchError.message)
    else setMovements(data || [])
  }

  return (
    <section style={{ display: 'grid', gap: 18 }}>
      {error && <div style={{ color: '#e14d5b', fontSize: 13 }}>{error}</div>}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#5f6b7a' }} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nombre…"
            style={{ width: '100%', padding: '10px 12px 10px 34px', borderRadius: 10, border: '1px solid #dfe7f6' }}
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #dfe7f6', minWidth: 200 }}
        >
          <option value="">Todas las categorías</option>
          {categories.map((category) => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>

      <div
        style={{
          background: '#fff',
          border: '1px solid #e5eaf3',
          borderRadius: 18,
          padding: 0,
          overflow: 'hidden',
          boxShadow: '0 12px 28px rgba(23,32,51,0.05)',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f7f9fd' }}>
            <tr>
              <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: 12, color: '#5f6b7a' }}>Producto</th>
              <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: 12, color: '#5f6b7a' }}>Categoría</th>
              <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: 12, color: '#5f6b7a' }}>Stock</th>
              <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: 12, color: '#5f6b7a' }}>Mínimo</th>
              <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: 12, color: '#5f6b7a' }}>Estado</th>
              <th style={{ textAlign: 'right', padding: '14px 16px', fontSize: 12, color: '#5f6b7a' }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 30, color: '#5f6b7a' }}>Cargando inventario…</td>
              </tr>
            )}

            {!loading && sorted.map((product) => {
              const low = product.stock <= product.minStock

              return (
                <tr key={product.id} style={{ borderTop: '1px solid #edf1f7' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 700 }}>{product.name}</td>
                  <td style={{ padding: '14px 16px', color: '#5f6b7a' }}>{product.category || '—'}</td>
                  <td style={{ padding: '14px 16px' }}>{product.stock} {unitShort(product)}</td>
                  <td style={{ padding: '14px 16px', color: '#5f6b7a' }}>{product.minStock} {unitShort(product)}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        background: low ? '#fff1f2' : '#edf7f1',
                        color: low ? '#c93d4e' : '#1ea97c',
                        borderRadius: 999,
                        padding: '5px 10px',
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {low ? 'Stock bajo' : 'Suficiente'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={() => handleViewMovements(product)}
                        title="Ver movimientos"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          border: '1px solid #dfe7f6',
                          background: '#fff',
                          borderRadius: 10,
                          padding: '8px 10px',
                          cursor: 'pointer',
                          fontWeight: 700,
                          color: '#5f6b7a',
                        }}
                      >
                        <History size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdjusting(product)}
                        style={{
                          border: '1px solid #dfe7f6',
                          background: '#fff',
                          borderRadius: 10,
                          padding: '8px 10px',
                          cursor: 'pointer',
                          fontWeight: 700,
                        }}
                      >
                        Ajustar
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}

            {!loading && sorted.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 30, color: '#5f6b7a' }}>No se encontraron productos.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {adjusting && (
        <AdjustModal
          product={adjusting}
          saving={saving}
          onCancel={() => setAdjusting(null)}
          onConfirm={(delta, type) => handleAdjust(adjusting.id, delta, type)}
        />
      )}

      {viewingMovements && (
        <MovementsModal
          product={viewingMovements}
          movements={movements}
          loading={movementsLoading}
          error={movementsError}
          onClose={() => setViewingMovements(null)}
        />
      )}
    </section>
  )
}
