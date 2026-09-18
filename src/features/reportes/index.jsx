import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, BarChart3, CircleDollarSign, CreditCard, Package, TrendingUp } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { supabase } from '../../lib/supabase'
import { unitShort, fromProductRow } from '../../lib/products'

const PAYMENT_LABELS = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  yape: 'Yape',
  plin: 'Plin',
}

const PAYMENT_COLORS = ['#2f6fed', '#1ea97c', '#e59a18', '#9b59b6']

function money(value) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 2 }).format(Number(value) || 0)
}

function getCutoff(period) {
  const cutoff = new Date()
  if (period === 'today') cutoff.setHours(0, 0, 0, 0)
  else if (period === 'month') cutoff.setDate(cutoff.getDate() - 30)
  else cutoff.setDate(cutoff.getDate() - 7)
  return cutoff
}

export default function ReportesModule() {
  const [period, setPeriod] = useState('week')
  const [sales, setSales] = useState([])
  const [lowStock, setLowStock] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    const cutoff = getCutoff(period)

    Promise.all([
      supabase
        .from('sales')
        .select('id, total, payment_method, created_at, sale_items(product_name, qty)')
        .gte('created_at', cutoff.toISOString())
        .order('created_at'),
      supabase.from('products').select('*').order('name'),
    ]).then(([salesRes, productsRes]) => {
      if (!active) return
      if (salesRes.error) setError(salesRes.error.message)
      else setSales(salesRes.data || [])
      if (productsRes.error) setError((current) => current || productsRes.error.message)
      else setLowStock((productsRes.data || []).map(fromProductRow).filter((product) => product.stock <= product.minStock).slice(0, 6))
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [period])

  const metrics = useMemo(() => {
    const total = sales.reduce((sum, sale) => sum + sale.total, 0)
    const transactions = sales.length
    const units = sales.reduce((sum, sale) => sum + (sale.sale_items || []).reduce((itemTotal, item) => itemTotal + item.qty, 0), 0)
    return { total, transactions, units, average: transactions ? total / transactions : 0 }
  }, [sales])

  const salesByDay = useMemo(() => {
    const grouped = sales.reduce((acc, sale) => {
      const key = sale.created_at.slice(0, 10)
      acc[key] = (acc[key] || 0) + sale.total
      return acc
    }, {})

    return Object.entries(grouped).map(([date, total]) => ({
      day: new Date(`${date}T12:00:00`).toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric' }).replace('.', ''),
      total: Number(total.toFixed(2)),
    }))
  }, [sales])

  const paymentData = useMemo(() => {
    const grouped = sales.reduce((acc, sale) => {
      const label = PAYMENT_LABELS[sale.payment_method] || sale.payment_method
      acc[label] = (acc[label] || 0) + sale.total
      return acc
    }, {})
    return Object.entries(grouped).map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }))
  }, [sales])

  const topProducts = useMemo(() => {
    const grouped = sales.reduce((acc, sale) => {
      (sale.sale_items || []).forEach((item) => { acc[item.product_name] = (acc[item.product_name] || 0) + item.qty })
      return acc
    }, {})
    return Object.entries(grouped).map(([name, units]) => ({ name, units })).sort((a, b) => b.units - a.units).slice(0, 5)
  }, [sales])

  return (
    <section style={{ display: 'grid', gap: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ color: '#5f6b7a', fontSize: 13 }}>Resumen comercial basado en las ventas registradas.</div>
        <select value={period} onChange={(event) => setPeriod(event.target.value)} style={{ padding: '9px 12px', borderRadius: 10, border: '1px solid #dfe7f6', background: '#fff', fontWeight: 600 }}>
          <option value="today">Hoy</option>
          <option value="week">Últimos 7 días</option>
          <option value="month">Últimos 30 días</option>
        </select>
      </div>

      {error && <div style={{ color: '#e14d5b', fontSize: 13 }}>{error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', color: '#5f6b7a', padding: 40 }}>Cargando reportes…</div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
            <Metric icon={CircleDollarSign} label="Ventas" value={money(metrics.total)} color="#2f6fed" />
            <Metric icon={CreditCard} label="Transacciones" value={metrics.transactions} color="#1ea97c" />
            <Metric icon={Package} label="Unidades vendidas" value={metrics.units} color="#e59a18" />
            <Metric icon={TrendingUp} label="Ticket promedio" value={money(metrics.average)} color="#9b59b6" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: 16 }}>
            <Panel title="Evolución de ventas" icon={BarChart3}>
              <div style={{ width: '100%', height: 245 }}>
                <ResponsiveContainer>
                  <BarChart data={salesByDay} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                    <CartesianGrid stroke="#e5eaf3" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#5f6b7a' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#5f6b7a' }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(value) => money(value)} contentStyle={{ borderRadius: 10, border: '1px solid #e5eaf3', fontSize: 13 }} />
                    <Bar dataKey="total" fill="#2f6fed" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title="Métodos de pago" icon={CreditCard}>
              <div style={{ width: '100%', height: 245 }}>
                {paymentData.length === 0 ? (
                  <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: '#5f6b7a', fontSize: 13 }}>Sin ventas en este periodo.</div>
                ) : (
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={paymentData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={82} paddingAngle={3}>
                        {paymentData.map((entry, index) => <Cell key={entry.name} fill={PAYMENT_COLORS[index % PAYMENT_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(value) => money(value)} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Panel>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
            <Panel title="Productos más vendidos" icon={TrendingUp}>
              <div style={{ display: 'grid', gap: 12 }}>
                {topProducts.length === 0 && <div style={{ color: '#5f6b7a', fontSize: 13 }}>Sin ventas en este periodo.</div>}
                {topProducts.map((product, index) => <div key={product.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 22, color: '#5f6b7a', fontWeight: 800 }}>{index + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</div>
                    <div style={{ height: 6, background: '#edf1f7', borderRadius: 99, marginTop: 5 }}><div style={{ width: `${Math.max(12, (product.units / (topProducts[0]?.units || 1)) * 100)}%`, height: '100%', background: '#2f6fed', borderRadius: 99 }} /></div>
                  </div>
                  <span style={{ fontWeight: 800, fontSize: 12 }}>{product.units} und.</span>
                </div>)}
              </div>
            </Panel>

            <Panel title="Alertas de inventario" icon={AlertTriangle}>
              <div style={{ display: 'grid', gap: 10 }}>
                {lowStock.length === 0 && <div style={{ color: '#5f6b7a', fontSize: 13 }}>No hay productos con stock bajo.</div>}
                {lowStock.map((product) => <div key={product.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid #edf1f7' }}>
                  <div style={{ minWidth: 0 }}><div style={{ fontWeight: 700, fontSize: 13 }}>{product.name}</div><div style={{ color: '#5f6b7a', fontSize: 11 }}>Mínimo: {product.minStock} {unitShort(product)}</div></div>
                  <span style={{ background: '#fff1f2', color: '#c93d4e', borderRadius: 999, padding: '5px 8px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>{product.stock} disponibles</span>
                </div>)}
              </div>
            </Panel>
          </div>
        </>
      )}
    </section>
  )
}

function Metric({ icon: Icon, label, value, color }) {
  return <div style={{ background: '#fff', border: '1px solid #e5eaf3', borderRadius: 18, padding: 16 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#5f6b7a', fontSize: 12, marginBottom: 8 }}><span>{label}</span><Icon size={16} color={color} /></div>
    <div style={{ fontWeight: 800, fontSize: 25 }}>{value}</div>
  </div>
}

function Panel({ title, icon: Icon, children }) {
  return <div style={{ background: '#fff', border: '1px solid #e5eaf3', borderRadius: 18, padding: 18, boxShadow: '0 12px 28px rgba(23,32,51,0.05)' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 15, marginBottom: 12 }}><Icon size={16} color="#2f6fed" />{title}</div>
    {children}
  </div>
}
