import { useEffect, useMemo, useState } from 'react'
import {
  Barcode,
  Check,
  Eye,
  History,
  Minus,
  Plus,
  Printer,
  Receipt,
  Search,
  ShoppingCart,
  Smartphone,
  Trash2,
  X,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { unitShort, fromProductRow } from '../../lib/products'
import { Thumb } from '../../components/Thumb'

const PAYMENTS = [
  { id: 'efectivo', label: 'Efectivo' },
  { id: 'tarjeta', label: 'Tarjeta' },
  { id: 'yape', label: 'Yape' },
  { id: 'plin', label: 'Plin' },
]

const DOC_TYPES = [
  { id: 'boleta', label: 'Boleta' },
  { id: 'factura', label: 'Factura' },
]

const DOC_TYPE_LABELS = {
  boleta: 'Boleta',
  factura: 'Factura',
  ticket: 'Ticket',
}

function docLabel(docType) {
  return DOC_TYPE_LABELS[docType] || docType
}

function fmt(value) {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(Number(value) || 0)
}

const PAYMENT_LABELS = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  yape: 'Yape',
  plin: 'Plin',
}

function saleDetailFromRow(row, businessSettings) {
  return {
    date: row.created_at,
    items: (row.sale_items || []).map((item) => ({ name: item.product_name, qty: item.qty, price: item.unit_price })),
    customerName: row.customers?.name || 'Cliente genérico',
    payment: row.payment_method,
    total: row.total,
    cashReceived: row.cash_received,
    change: row.change,
    docType: row.doc_type,
    docSeries: row.doc_series,
    docNumber: row.doc_number,
    subtotal: row.subtotal,
    igv: row.igv,
    business: businessSettings,
    isHistory: true,
  }
}

export default function PosModule() {
  const [products, setProducts] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [cart, setCart] = useState([])
  const [customerId, setCustomerId] = useState('generic')
  const [docType, setDocType] = useState('boleta')
  const [payment, setPayment] = useState('efectivo')
  const [cashReceived, setCashReceived] = useState('')
  const [businessSettings, setBusinessSettings] = useState(null)
  const [lastReceipt, setLastReceipt] = useState(null)
  const [charging, setCharging] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState('')
  const [historyQuery, setHistoryQuery] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    if (!showHistory) return
    let active = true
    setHistoryLoading(true)

    let request = supabase
      .from('sales')
      .select('id, created_at, payment_method, total, cash_received, change, doc_type, doc_series, doc_number, subtotal, igv, customers(name), sale_items(product_name, qty, unit_price)')

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

  const filteredHistory = useMemo(() => {
    const term = historyQuery.trim().toLowerCase()
    if (!term) return history

    return history.filter((sale) => {
      const customerName = (sale.customers?.name || 'Cliente genérico').toLowerCase()
      const paymentLabel = (PAYMENT_LABELS[sale.payment_method] || sale.payment_method).toLowerCase()
      return customerName.includes(term) || paymentLabel.includes(term)
    })
  }, [history, historyQuery])

  async function loadProducts() {
    const { data, error: fetchError } = await supabase.from('products').select('*').order('name')
    if (fetchError) {
      setError(fetchError.message)
      return
    }
    setProducts((data || []).map(fromProductRow))
  }

  useEffect(() => {
    let active = true

    Promise.all([
      supabase.from('products').select('*').order('name'),
      supabase.from('customers').select('id, name').order('name'),
      supabase.from('business_settings').select('*').eq('id', 1).single(),
    ]).then(([productsRes, customersRes, businessRes]) => {
      if (!active) return
      if (productsRes.error) setError(productsRes.error.message)
      else setProducts((productsRes.data || []).map(fromProductRow))
      if (customersRes.error) setError(customersRes.error.message)
      else setCustomers(customersRes.data || [])
      if (!businessRes.error) setBusinessSettings(businessRes.data || null)
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [])

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return products

    return products.filter((product) => {
      const hayNombre = product.name.toLowerCase().includes(term)
      const hayCodigo = product.barcode.includes(term)
      return hayNombre || hayCodigo
    })
  }, [query, products])

  const cartLines = cart
    .map((line) => {
      const product = products.find((item) => item.id === line.productId)
      return product ? { ...line, product } : null
    })
    .filter(Boolean)

  const total = cartLines.reduce((sum, line) => sum + line.product.salePrice * line.qty, 0)
  const received = Number(cashReceived) || 0
  const change = payment === 'efectivo' ? Math.max(0, received - total) : 0
  const canConfirm = cartLines.length > 0 && (payment !== 'efectivo' || received >= total) && !charging

  function addToCart(product) {
    if (product.stock <= 0) return

    setCart((current) => {
      const existing = current.find((line) => line.productId === product.id)
      if (existing) {
        if (existing.qty >= product.stock) return current
        return current.map((line) =>
          line.productId === product.id ? { ...line, qty: line.qty + 1 } : line,
        )
      }

      return [...current, { productId: product.id, qty: 1 }]
    })
  }

  function changeQty(productId, delta) {
    setCart((current) =>
      current
        .map((line) => {
          if (line.productId !== productId) return line

          const product = products.find((item) => item.id === productId)
          const nextQty = Math.min(product?.stock ?? line.qty, line.qty + delta)
          return { ...line, qty: nextQty }
        })
        .map((line) => ({ ...line, qty: Math.max(1, line.qty) }))
        .filter((line) => line.qty > 0),
    )
  }

  function removeLine(productId) {
    setCart((current) => current.filter((line) => line.productId !== productId))
  }

  function handleSearchKeyDown(event) {
    if (event.key !== 'Enter') return

    const exact = products.find((product) => product.barcode === query.trim())
    if (exact) {
      addToCart(exact)
      setQuery('')
    }
  }

  async function confirmSale() {
    if (!canConfirm) return

    setCharging(true)
    setError('')

    const payload = {
      customer_id: customerId === 'generic' ? null : customerId,
      doc_type: businessSettings?.tax_enabled ? docType : 'ticket',
      payment_method: payment,
      total,
      cash_received: payment === 'efectivo' ? received : null,
      change: payment === 'efectivo' ? change : null,
      items: cartLines.map((line) => ({
        product_id: line.productId,
        name: line.product.name,
        qty: line.qty,
        price: line.product.salePrice,
      })),
    }

    const { data: sale, error: saleError } = await supabase.rpc('register_sale', { payload })

    if (saleError) {
      setError(saleError.message)
      setCharging(false)
      return
    }

    await loadProducts()

    setLastReceipt({
      date: sale.created_at,
      items: payload.items,
      customerName: customerId === 'generic' ? 'Cliente genérico' : (customers.find((c) => c.id === customerId)?.name || 'Cliente genérico'),
      payment,
      total,
      cashReceived: payload.cash_received,
      change: payload.change,
      docType: sale.doc_type,
      docSeries: sale.doc_series,
      docNumber: sale.doc_number,
      subtotal: sale.subtotal,
      igv: sale.igv,
      business: businessSettings,
      isHistory: false,
    })
    setCart([])
    setCashReceived('')
    setCustomerId('generic')
    setDocType('boleta')
    setPayment('efectivo')
    setCharging(false)
  }

  return (
    <section style={{ display: 'grid', gap: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ color: '#5f6b7a', fontSize: 13 }}>
          {showHistory ? 'Ventas registradas anteriormente.' : 'Toca un producto para agregarlo al carrito.'}
        </div>
        <button
          type="button"
          onClick={() => setShowHistory((value) => !value)}
          style={{ border: '1px solid #dfe7f6', background: '#fff', borderRadius: 10, padding: '9px 14px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 13 }}
        >
          <History size={15} /> {showHistory ? 'Volver a vender' : 'Ver historial'}
        </button>
      </div>

      {showHistory ? (
        <div style={{ display: 'grid', gap: 14 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 220, maxWidth: 320 }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#5f6b7a' }} />
              <input
                value={historyQuery}
                onChange={(event) => setHistoryQuery(event.target.value)}
                placeholder="Buscar por cliente o método de pago…"
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
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: 12, color: '#5f6b7a' }}>Comprobante</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: 12, color: '#5f6b7a' }}>Cliente</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: 12, color: '#5f6b7a' }}>Método de pago</th>
                  <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: 12, color: '#5f6b7a' }}>Ítems</th>
                  <th style={{ textAlign: 'right', padding: '14px 16px', fontSize: 12, color: '#5f6b7a' }}>Total</th>
                  <th style={{ textAlign: 'right', padding: '14px 16px', fontSize: 12, color: '#5f6b7a' }}></th>
                </tr>
              </thead>
              <tbody>
                {historyLoading && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: 30, color: '#5f6b7a' }}>Cargando historial…</td>
                  </tr>
                )}

                {!historyLoading && filteredHistory.map((sale) => {
                  const unitCount = (sale.sale_items || []).reduce((sum, item) => sum + item.qty, 0)
                  return (
                    <tr key={sale.id} style={{ borderTop: '1px solid #edf1f7' }}>
                      <td style={{ padding: '14px 16px', color: '#5f6b7a' }}>{new Date(sale.created_at).toLocaleString('es-PE')}</td>
                      <td style={{ padding: '14px 16px' }}>
                        {sale.doc_number ? (
                          <>
                            <span style={{ background: '#edf3ff', color: '#2f6fed', borderRadius: 999, padding: '4px 9px', fontSize: 11, fontWeight: 700, marginRight: 6 }}>
                              {docLabel(sale.doc_type)}
                            </span>
                            {sale.doc_series}-{String(sale.doc_number).padStart(6, '0')}
                          </>
                        ) : (
                          <span style={{ color: '#5f6b7a', fontSize: 12.5 }}>Sin comprobante</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 700 }}>{sale.customers?.name || 'Cliente genérico'}</td>
                      <td style={{ padding: '14px 16px' }}>{PAYMENT_LABELS[sale.payment_method] || sale.payment_method}</td>
                      <td style={{ padding: '14px 16px', color: '#5f6b7a' }}>{unitCount} und.</td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 800 }}>{fmt(sale.total)}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => setLastReceipt(saleDetailFromRow(sale, businessSettings))}
                          style={{ border: '1px solid #dfe7f6', background: '#fff', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 12.5 }}
                        >
                          <Eye size={13} /> Ver detalle
                        </button>
                      </td>
                    </tr>
                  )
                })}

                {!historyLoading && filteredHistory.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: 30, color: '#5f6b7a' }}>No hay ventas registradas.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.9fr', gap: 18 }}>
      <div>
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#5f6b7a' }} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Buscar por nombre o código de barras…"
            style={{ width: '100%', padding: '10px 40px 10px 36px', borderRadius: 12, border: '1px solid #dfe7f6' }}
          />
          <Barcode size={16} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#5f6b7a' }} />
        </div>

        {error && <div style={{ color: '#e14d5b', fontSize: 13, marginBottom: 12 }}>{error}</div>}

        {loading ? (
          <div style={{ textAlign: 'center', color: '#5f6b7a', padding: 40 }}>Cargando productos…</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            {filtered.map((product) => {
              const inCartQty = cart.find((line) => line.productId === product.id)?.qty || 0
              const disabled = product.stock <= 0 || inCartQty >= product.stock

              return (
                <button
                  key={product.id}
                  type="button"
                  className="pos-product-card"
                  onClick={() => !disabled && addToCart(product)}
                  disabled={disabled}
                >
                  <Thumb url={product.imageUrl} name={product.name} width="100%" height={90} radius={0} fontSize={18} />
                  <div style={{ padding: '10px 12px 12px' }}>
                    <div style={{ minHeight: 34, fontSize: 13, fontWeight: 700, lineHeight: 1.25 }}>{product.name}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, color: '#2f6fed' }}>{fmt(product.salePrice)}</span>
                      <span style={{ fontSize: 11, color: product.stock <= product.minStock ? '#e14d5b' : '#5f6b7a', fontWeight: 700 }}>
                        {product.stock} {unitShort(product)}
                      </span>
                    </div>
                  </div>
                </button>
              )
            })}

            {filtered.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#5f6b7a', padding: 40 }}>
                No se encontraron productos.
              </div>
            )}
          </div>
        )}
      </div>

      <aside
        style={{
          background: '#fff',
          border: '1px solid #e5eaf3',
          borderRadius: 18,
          padding: 18,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          boxShadow: '0 12px 28px rgba(23,32,51,0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800 }}>
          <ShoppingCart size={17} /> Carrito
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 260, overflowY: 'auto' }}>
          {cartLines.length === 0 && <div style={{ color: '#5f6b7a', fontSize: 13 }}>Agrega productos tocando una tarjeta.</div>}

          {cartLines.map((line) => (
            <div key={line.productId} className="cart-line-enter" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {line.product.name}
                </div>
                <div style={{ color: '#5f6b7a', fontSize: 11.5 }}>{fmt(line.product.salePrice)} c/u</div>
              </div>

              <button type="button" onClick={() => changeQty(line.productId, -1)} style={{ border: '1px solid #dfe7f6', background: '#fff', borderRadius: 8, width: 26, height: 26, cursor: 'pointer' }}>
                <Minus size={12} />
              </button>
              <span style={{ minWidth: 18, textAlign: 'center', fontWeight: 700 }}>{line.qty}</span>
              <button type="button" onClick={() => changeQty(line.productId, 1)} style={{ border: '1px solid #dfe7f6', background: '#fff', borderRadius: 8, width: 26, height: 26, cursor: 'pointer' }}>
                <Plus size={12} />
              </button>
              <button type="button" onClick={() => removeLine(line.productId)} style={{ border: '1px solid #f5d2d7', background: '#fff', borderRadius: 8, width: 26, height: 26, cursor: 'pointer', color: '#d9534f' }}>
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Cliente</label>
          <select value={customerId} onChange={(event) => setCustomerId(event.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #dfe7f6' }}>
            <option value="generic">Cliente genérico</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>{customer.name}</option>
            ))}
          </select>
        </div>

        {businessSettings?.tax_enabled && (
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Tipo de comprobante</label>
            <select value={docType} onChange={(event) => setDocType(event.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #dfe7f6' }}>
              {DOC_TYPES.map((type) => (
                <option key={type.id} value={type.id}>{type.label}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Método de pago</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {PAYMENTS.map((method) => (
              <button
                key={method.id}
                type="button"
                onClick={() => setPayment(method.id)}
                style={{
                  border: payment === method.id ? '1px solid #2f6fed' : '1px solid #dfe7f6',
                  background: payment === method.id ? '#2f6fed' : '#fff',
                  color: payment === method.id ? '#fff' : '#172033',
                  borderRadius: 10,
                  padding: '8px 10px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                {(method.id === 'yape' || method.id === 'plin') && <Smartphone size={13} />}
                {method.label}
              </button>
            ))}
          </div>
        </div>

        {payment === 'efectivo' && (
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Monto recibido</label>
            <input
              type="number"
              value={cashReceived}
              onChange={(event) => setCashReceived(event.target.value)}
              placeholder="0.00"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #dfe7f6' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 13 }}>
              <span style={{ color: '#5f6b7a' }}>Vuelto</span>
              <span style={{ fontWeight: 800, color: received >= total && total > 0 ? '#2f6fed' : '#5f6b7a' }}>{fmt(change)}</span>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: '1px solid #e5eaf3', paddingTop: 12 }}>
          <span style={{ fontWeight: 700, color: '#5f6b7a' }}>Total</span>
          <span style={{ fontSize: 28, fontWeight: 800 }}>{fmt(total)}</span>
        </div>

        <button
          type="button"
          onClick={confirmSale}
          disabled={!canConfirm}
          style={{
            border: 'none',
            borderRadius: 12,
            padding: '12px 16px',
            background: canConfirm ? '#2f6fed' : '#dfe7f6',
            color: canConfirm ? '#fff' : '#5f6b7a',
            fontWeight: 800,
            cursor: canConfirm ? 'pointer' : 'not-allowed',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <Check size={16} /> {charging ? 'Cobrando…' : `Cobrar ${fmt(total)}`}
        </button>
      </aside>
    </div>
      )}

      {lastReceipt && (
        <div
          onClick={() => setLastReceipt(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(23,32,51,0.4)',
            display: 'grid',
            placeItems: 'center',
            padding: 20,
          }}
        >
          <div onClick={(event) => event.stopPropagation()} className="receipt-print" style={{ width: '100%', maxWidth: 420, background: '#fff', borderRadius: 18, padding: 20, boxShadow: '0 18px 40px rgba(23,32,51,0.15)' }}>
            <div className="receipt-print-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800 }}>
                <Receipt size={18} color="#2f6fed" /> {lastReceipt.isHistory ? 'Detalle de venta' : 'Venta registrada'}
              </div>
              <button type="button" onClick={() => setLastReceipt(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            {lastReceipt.business && (
              <div style={{ textAlign: 'center', marginBottom: 10 }}>
                <div style={{ fontWeight: 800, fontSize: 15 }}>{lastReceipt.business.business_name}</div>
                {lastReceipt.business.document && <div style={{ color: '#5f6b7a', fontSize: 12 }}>RUC {lastReceipt.business.document}</div>}
                {lastReceipt.business.address && <div style={{ color: '#5f6b7a', fontSize: 12 }}>{lastReceipt.business.address}</div>}
                {lastReceipt.business.phone && <div style={{ color: '#5f6b7a', fontSize: 12 }}>Tel. {lastReceipt.business.phone}</div>}
              </div>
            )}

            <div style={{ textAlign: 'center', fontWeight: 800, fontSize: 13, marginBottom: lastReceipt.docType === 'ticket' ? 2 : 10 }}>
              {lastReceipt.docNumber
                ? `${docLabel(lastReceipt.docType).toUpperCase()} ${lastReceipt.docSeries}-${String(lastReceipt.docNumber).padStart(6, '0')}`
                : 'Sin comprobante'}
            </div>

            {lastReceipt.docType === 'ticket' && (
              <div style={{ textAlign: 'center', color: '#5f6b7a', fontSize: 11, marginBottom: 10 }}>
                Documento sin valor tributario — solo control interno
              </div>
            )}

            <div style={{ color: '#5f6b7a', fontSize: 13, marginBottom: 10 }}>
              {lastReceipt.customerName} · {new Date(lastReceipt.date).toLocaleString('es-PE')}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
              {lastReceipt.items.map((item, index) => (
                <div key={`${item.name}-${index}`} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span>{item.qty}× {item.name}</span>
                  <span style={{ fontWeight: 700 }}>{fmt(item.qty * item.price)}</span>
                </div>
              ))}
            </div>

            {lastReceipt.igv > 0 && (
              <div style={{ borderTop: '1px solid #e5eaf3', paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: '#5f6b7a' }}>
                  <span>Op. gravada</span>
                  <span>{fmt(lastReceipt.subtotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: '#5f6b7a' }}>
                  <span>IGV ({Math.round((lastReceipt.igv / lastReceipt.subtotal) * 100)}%)</span>
                  <span>{fmt(lastReceipt.igv)}</span>
                </div>
              </div>
            )}

            <div style={{ borderTop: lastReceipt.igv > 0 ? 'none' : '1px solid #e5eaf3', display: 'flex', justifyContent: 'space-between', paddingTop: lastReceipt.igv > 0 ? 4 : 10 }}>
              <span style={{ fontWeight: 700 }}>Total</span>
              <span style={{ fontWeight: 800 }}>{fmt(lastReceipt.total)}</span>
            </div>

            {lastReceipt.payment === 'efectivo' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, color: '#5f6b7a', fontSize: 13 }}>
                <span>Recibido {fmt(lastReceipt.cashReceived)}</span>
                <span>Vuelto {fmt(lastReceipt.change)}</span>
              </div>
            )}

            {lastReceipt.business?.receipt_message && (
              <div style={{ textAlign: 'center', color: '#5f6b7a', fontSize: 12, marginTop: 14 }}>
                {lastReceipt.business.receipt_message}
              </div>
            )}

            <div className="receipt-print-actions" style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button type="button" onClick={() => window.print()} style={{ flex: 1, border: '1px solid #dfe7f6', background: '#fff', borderRadius: 10, padding: '12px 16px', fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Printer size={16} /> Imprimir / PDF
              </button>
              <button type="button" onClick={() => setLastReceipt(null)} style={{ flex: 1, border: 'none', background: '#2f6fed', color: '#fff', borderRadius: 10, padding: '12px 16px', fontWeight: 800, cursor: 'pointer' }}>
                {lastReceipt.isHistory ? 'Cerrar' : 'Nueva venta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
