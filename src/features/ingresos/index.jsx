import { useEffect, useMemo, useState } from 'react'
import { Barcode, Check, Eye, History, Search, Trash2, Truck, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { fromProductRow } from '../../lib/products'

const DOC_TYPES = [
  { id: 'boleta', label: 'Boleta' },
  { id: 'factura', label: 'Factura' },
  { id: 'guia', label: 'Guía de remisión' },
  { id: 'otro', label: 'Otro' },
]

function docLabel(docType) {
  return DOC_TYPES.find((d) => d.id === docType)?.label || docType
}

function money(value) {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(Number(value) || 0)
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function receiptDetailFromRow(row) {
  return {
    docType: row.doc_type,
    docNumber: row.doc_number,
    supplier: row.supplier,
    date: row.doc_date,
    createdAt: row.created_at,
    items: (row.receipt_items || []).map((item) => ({ name: item.product_name, qty: item.qty, costPrice: item.cost_price })),
    totalUnits: row.total_units,
    totalCost: row.total_cost,
  }
}

export default function IngresosModule() {
  const [products, setProducts] = useState([])
  const [proveedores, setProveedores] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [lines, setLines] = useState([])
  const [docType, setDocType] = useState('boleta')
  const [docNumber, setDocNumber] = useState('')
  const [supplierId, setSupplierId] = useState('')
  const [date, setDate] = useState(todayStr())
  const [saving, setSaving] = useState(false)
  const [viewingReceipt, setViewingReceipt] = useState(null)

  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState('')
  const [historyQuery, setHistoryQuery] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  function loadProducts() {
    return supabase.from('products').select('*').order('name').then(({ data, error: fetchError }) => {
      if (fetchError) setError(fetchError.message)
      else setProducts((data || []).map(fromProductRow))
    })
  }

  useEffect(() => {
    let active = true

    Promise.all([
      loadProducts(),
      supabase.from('proveedores').select('id, name').order('name'),
    ]).then(([, proveedoresRes]) => {
      if (!active) return
      if (proveedoresRes.error) setError(proveedoresRes.error.message)
      else setProveedores(proveedoresRes.data || [])
      setLoading(false)
    })

    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!showHistory) return
    let active = true
    setHistoryLoading(true)

    let request = supabase
      .from('receipts')
      .select('id, doc_type, doc_number, supplier, doc_date, total_units, total_cost, created_at, receipt_items(product_name, qty, cost_price)')

    if (dateFrom) request = request.gte('created_at', `${dateFrom}T00:00:00`)
    if (dateTo) request = request.lte('created_at', `${dateTo}T23:59:59`)

    request
      .order('created_at', { ascending: false })
      .limit(300)
      .then(({ data, error: fetchError }) => {
        if (!active) return
        if (fetchError) setHistoryError(fetchError.message)
        else setHistory(data || [])
        setHistoryLoading(false)
      })

    return () => {
      active = false
    }
  }, [showHistory, dateFrom, dateTo])

  const suggestions = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return []
    return products
      .filter((product) => product.name.toLowerCase().includes(term) || product.barcode.includes(term))
      .filter((product) => !lines.some((line) => line.productId === product.id))
      .slice(0, 8)
  }, [query, products, lines])

  const filteredHistory = useMemo(() => {
    const term = historyQuery.trim().toLowerCase()
    if (!term) return history
    return history.filter((receipt) =>
      `${receipt.supplier} ${receipt.doc_number} ${docLabel(receipt.doc_type)}`.toLowerCase().includes(term),
    )
  }, [history, historyQuery])

  function addLine(product) {
    setLines((current) => {
      if (current.some((line) => line.productId === product.id)) return current
      return [...current, { productId: product.id, name: product.name, qty: 1, costPrice: product.costPrice || 0 }]
    })
    setQuery('')
  }

  function handleSearchKeyDown(event) {
    if (event.key !== 'Enter') return
    const exact = products.find((product) => product.barcode === query.trim())
    if (exact) addLine(exact)
  }

  function updateLine(productId, field, value) {
    setLines((current) => current.map((line) => (line.productId === productId ? { ...line, [field]: value } : line)))
  }

  function removeLine(productId) {
    setLines((current) => current.filter((line) => line.productId !== productId))
  }

  const totalUnits = lines.reduce((sum, line) => sum + (parseInt(line.qty) || 0), 0)
  const totalCost = lines.reduce((sum, line) => sum + (parseInt(line.qty) || 0) * (parseFloat(line.costPrice) || 0), 0)
  const canConfirm = lines.length > 0 && lines.every((line) => (parseInt(line.qty) || 0) > 0) && docNumber.trim() !== '' && supplierId !== '' && !saving

  async function confirmReceipt() {
    if (!canConfirm) return

    setSaving(true)
    setError('')

    const supplierName = proveedores.find((proveedor) => proveedor.id === supplierId)?.name || ''

    const payload = {
      doc_type: docType,
      doc_number: docNumber.trim(),
      supplier: supplierName,
      supplier_id: supplierId,
      doc_date: date,
      total_units: totalUnits,
      total_cost: totalCost,
      items: lines.map((line) => ({
        product_id: line.productId,
        name: line.name,
        qty: parseInt(line.qty) || 0,
        cost_price: parseFloat(line.costPrice) || 0,
      })),
    }

    const { error: rpcError } = await supabase.rpc('register_receipt', { payload })

    if (rpcError) {
      setError(rpcError.message)
      setSaving(false)
      return
    }

    setViewingReceipt({
      docType,
      docNumber: payload.doc_number,
      supplier: payload.supplier,
      date,
      createdAt: new Date().toISOString(),
      items: lines.map((line) => ({ name: line.name, qty: parseInt(line.qty) || 0, costPrice: parseFloat(line.costPrice) || 0 })),
      totalUnits,
      totalCost,
    })

    setLines([])
    setDocNumber('')
    setSupplierId('')
    setDate(todayStr())
    setSaving(false)
    loadProducts()
  }

  return (
    <section style={{ display: 'grid', gap: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ color: '#5f6b7a', fontSize: 13 }}>
          {showHistory
            ? 'Ingresos de mercadería registrados anteriormente.'
            : 'Registra el documento del proveedor y los productos recibidos para actualizar tu stock.'}
        </div>
        <button
          type="button"
          onClick={() => setShowHistory((value) => !value)}
          style={{ border: '1px solid #dfe7f6', background: '#fff', borderRadius: 10, padding: '9px 14px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 13 }}
        >
          <History size={15} /> {showHistory ? 'Volver a registrar' : 'Ver historial'}
        </button>
      </div>

      {error && <div style={{ color: '#e14d5b', fontSize: 13 }}>{error}</div>}

      {showHistory ? (
        <div style={{ display: 'grid', gap: 14 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 220, maxWidth: 320 }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#5f6b7a' }} />
              <input
                value={historyQuery}
                onChange={(event) => setHistoryQuery(event.target.value)}
                placeholder="Buscar proveedor o documento…"
                style={{ width: '100%', padding: '10px 12px 10px 34px', borderRadius: 10, border: '1px solid #dfe7f6' }}
              />
            </div>
            <label style={{ fontSize: 12, color: '#5f6b7a', fontWeight: 600 }}>Desde
              <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} style={{ display: 'block', marginTop: 4, padding: '8px 10px', borderRadius: 9, border: '1px solid #dfe7f6' }} />
            </label>
            <label style={{ fontSize: 12, color: '#5f6b7a', fontWeight: 600 }}>Hasta
              <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} style={{ display: 'block', marginTop: 4, padding: '8px 10px', borderRadius: 9, border: '1px solid #dfe7f6' }} />
            </label>
            {(dateFrom || dateTo) && (
              <button
                type="button"
                onClick={() => { setDateFrom(''); setDateTo('') }}
                style={{ alignSelf: 'flex-end', border: '1px solid #dfe7f6', background: '#fff', borderRadius: 9, padding: '8px 12px', cursor: 'pointer', fontWeight: 700, fontSize: 12.5 }}
              >
                Limpiar fechas
              </button>
            )}
          </div>

          {historyError && <div style={{ color: '#e14d5b', fontSize: 13 }}>{historyError}</div>}

          <div style={{ background: '#fff', border: '1px solid #e5eaf3', borderRadius: 18, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f7f9fd' }}>
                <tr>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: 12, color: '#5f6b7a' }}>Fecha</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: 12, color: '#5f6b7a' }}>Documento</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: 12, color: '#5f6b7a' }}>Proveedor</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: 12, color: '#5f6b7a' }}>Ítems</th>
                  <th style={{ textAlign: 'right', padding: '14px 16px', fontSize: 12, color: '#5f6b7a' }}>Costo total</th>
                  <th style={{ textAlign: 'right', padding: '14px 16px', fontSize: 12, color: '#5f6b7a' }}></th>
                </tr>
              </thead>
              <tbody>
                {historyLoading && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: 30, color: '#5f6b7a' }}>Cargando historial…</td>
                  </tr>
                )}

                {!historyLoading && filteredHistory.map((receipt) => (
                  <tr key={receipt.id} style={{ borderTop: '1px solid #edf1f7' }}>
                    <td style={{ padding: '14px 16px', color: '#5f6b7a' }}>{new Date(receipt.doc_date).toLocaleDateString('es-PE')}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ background: '#edf3ff', color: '#2f6fed', borderRadius: 999, padding: '4px 9px', fontSize: 11, fontWeight: 700, marginRight: 6 }}>
                        {docLabel(receipt.doc_type)}
                      </span>
                      {receipt.doc_number}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#5f6b7a' }}>{receipt.supplier}</td>
                    <td style={{ padding: '14px 16px', color: '#5f6b7a' }}>{receipt.total_units} und.</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 800 }}>{money(receipt.total_cost)}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => setViewingReceipt(receiptDetailFromRow(receipt))}
                        style={{ border: '1px solid #dfe7f6', background: '#fff', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 12.5 }}
                      >
                        <Eye size={13} /> Ver detalle
                      </button>
                    </td>
                  </tr>
                ))}

                {!historyLoading && filteredHistory.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: 30, color: '#5f6b7a' }}>No hay ingresos registrados.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #e5eaf3', borderRadius: 18, padding: 18, boxShadow: '0 12px 28px rgba(23,32,51,0.05)', display: 'grid', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 15 }}>
            <Truck size={17} /> Datos del comprobante
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Tipo de documento</label>
              <select value={docType} onChange={(event) => setDocType(event.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #dfe7f6' }}>
                {DOC_TYPES.map((type) => (
                  <option key={type.id} value={type.id}>{type.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Número de documento</label>
              <input value={docNumber} onChange={(event) => setDocNumber(event.target.value)} placeholder="F-001-1043" style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #dfe7f6' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Proveedor</label>
              <select value={supplierId} onChange={(event) => setSupplierId(event.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #dfe7f6' }}>
                <option value="" disabled>Selecciona un proveedor…</option>
                {proveedores.map((proveedor) => (
                  <option key={proveedor.id} value={proveedor.id}>{proveedor.name}</option>
                ))}
              </select>
              {proveedores.length === 0 && (
                <div style={{ color: '#5f6b7a', fontSize: 11.5, marginTop: 4 }}>No hay proveedores registrados. Crea uno en el módulo Proveedores.</div>
              )}
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Fecha</label>
              <input type="date" value={date} onChange={(event) => setDate(event.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #dfe7f6' }} />
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Agregar producto</label>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#5f6b7a' }} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder={loading ? 'Cargando productos…' : 'Buscar por nombre o código de barras…'}
                disabled={loading}
                style={{ width: '100%', padding: '10px 34px 10px 34px', borderRadius: 10, border: '1px solid #dfe7f6' }}
              />
              <Barcode size={15} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#5f6b7a' }} />
            </div>

            {suggestions.length > 0 && (
              <div style={{ position: 'absolute', zIndex: 10, top: '100%', left: 0, right: 0, marginTop: 4, background: '#fff', border: '1px solid #e5eaf3', borderRadius: 12, boxShadow: '0 12px 28px rgba(23,32,51,0.1)', overflow: 'hidden' }}>
                {suggestions.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => addLine(product)}
                    style={{ width: '100%', textAlign: 'left', border: 'none', background: '#fff', padding: '10px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', gap: 10 }}
                    onMouseEnter={(event) => { event.currentTarget.style.background = '#f7f9fd' }}
                    onMouseLeave={(event) => { event.currentTarget.style.background = '#fff' }}
                  >
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{product.name}</span>
                    <span style={{ color: '#5f6b7a', fontSize: 12 }}>{product.barcode || 'sin código'} · stock {product.stock}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ border: '1px solid #edf1f7', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f7f9fd' }}>
                <tr>
                  <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 12, color: '#5f6b7a' }}>Producto</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 12, color: '#5f6b7a', width: 110 }}>Cantidad</th>
                  <th style={{ textAlign: 'left', padding: '10px 14px', fontSize: 12, color: '#5f6b7a', width: 130 }}>Costo unit.</th>
                  <th style={{ textAlign: 'right', padding: '10px 14px', fontSize: 12, color: '#5f6b7a', width: 110 }}>Subtotal</th>
                  <th style={{ padding: '10px 14px', width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => (
                  <tr key={line.productId} style={{ borderTop: '1px solid #edf1f7' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 700 }}>{line.name}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <input
                        type="number"
                        min="1"
                        value={line.qty}
                        onChange={(event) => updateLine(line.productId, 'qty', event.target.value)}
                        style={{ width: '100%', padding: '6px 8px', borderRadius: 8, border: '1px solid #dfe7f6' }}
                      />
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.costPrice}
                        onChange={(event) => updateLine(line.productId, 'costPrice', event.target.value)}
                        style={{ width: '100%', padding: '6px 8px', borderRadius: 8, border: '1px solid #dfe7f6' }}
                      />
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700 }}>
                      {money((parseInt(line.qty) || 0) * (parseFloat(line.costPrice) || 0))}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                      <button type="button" onClick={() => removeLine(line.productId)} style={{ border: '1px solid #f5d2d7', background: '#fff', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', color: '#d9534f' }}>
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}

                {lines.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: 24, color: '#5f6b7a', fontSize: 13 }}>Busca un producto arriba para agregarlo al detalle.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e5eaf3', paddingTop: 14, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', gap: 20 }}>
              <div>
                <div style={{ color: '#5f6b7a', fontSize: 12 }}>Unidades</div>
                <div style={{ fontWeight: 800, fontSize: 18 }}>{totalUnits}</div>
              </div>
              <div>
                <div style={{ color: '#5f6b7a', fontSize: 12 }}>Costo total</div>
                <div style={{ fontWeight: 800, fontSize: 18 }}>{money(totalCost)}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={confirmReceipt}
              disabled={!canConfirm}
              style={{
                border: 'none',
                borderRadius: 12,
                padding: '12px 18px',
                background: canConfirm ? '#2f6fed' : '#dfe7f6',
                color: canConfirm ? '#fff' : '#5f6b7a',
                fontWeight: 800,
                cursor: canConfirm ? 'pointer' : 'not-allowed',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Check size={16} /> {saving ? 'Registrando…' : 'Registrar ingreso'}
            </button>
          </div>
        </div>
      )}

      {viewingReceipt && (
        <div
          onClick={() => setViewingReceipt(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(23,32,51,0.4)', display: 'grid', placeItems: 'center', padding: 20 }}
        >
          <div onClick={(event) => event.stopPropagation()} style={{ width: '100%', maxWidth: 460, background: '#fff', borderRadius: 18, padding: 20, boxShadow: '0 18px 40px rgba(23,32,51,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800 }}>
                <Truck size={18} color="#2f6fed" /> {docLabel(viewingReceipt.docType)} {viewingReceipt.docNumber}
              </div>
              <button type="button" onClick={() => setViewingReceipt(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ color: '#5f6b7a', fontSize: 13, marginBottom: 10 }}>
              {viewingReceipt.supplier} · {new Date(viewingReceipt.date).toLocaleDateString('es-PE')}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
              {viewingReceipt.items.map((item, index) => (
                <div key={`${item.name}-${index}`} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span>{item.qty}× {item.name}</span>
                  <span style={{ fontWeight: 700 }}>{money(item.qty * item.costPrice)}</span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid #e5eaf3', display: 'flex', justifyContent: 'space-between', paddingTop: 10 }}>
              <span style={{ fontWeight: 700 }}>Costo total</span>
              <span style={{ fontWeight: 800 }}>{money(viewingReceipt.totalCost)}</span>
            </div>

            <button type="button" onClick={() => setViewingReceipt(null)} style={{ width: '100%', marginTop: 16, border: 'none', background: '#2f6fed', color: '#fff', borderRadius: 10, padding: '12px 16px', fontWeight: 800, cursor: 'pointer' }}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
