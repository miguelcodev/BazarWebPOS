import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, BarChart3, Package, TrendingUp } from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { supabase } from '../../lib/supabase'
import { unitShort, fromProductRow } from '../../lib/products'

function fmt(value) {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(Number(value) || 0)
}

export default function DashboardModule() {
  const [products, setProducts] = useState([])
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 31)

    Promise.all([
      supabase.from('products').select('*').order('name'),
      supabase
        .from('sales')
        .select('id, total, created_at, sale_items(product_id, product_name, qty)')
        .gte('created_at', cutoff.toISOString())
        .is('voided_at', null),
    ]).then(([productsRes, salesRes]) => {
      if (!active) return
      if (productsRes.error) setError(productsRes.error.message)
      else setProducts((productsRes.data || []).map(fromProductRow))
      if (salesRes.error) setError((current) => current || salesRes.error.message)
      else setSales(salesRes.data || [])
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [])

  const today = new Date().toISOString().slice(0, 10)
  const salesToday = sales.filter((sale) => sale.created_at.slice(0, 10) === today)
  const totalToday = salesToday.reduce((sum, sale) => sum + sale.total, 0)

  const monthPrefix = today.slice(0, 7)
  const salesMonth = sales.filter((sale) => sale.created_at.slice(0, 7) === monthPrefix)
  const totalMonth = salesMonth.reduce((sum, sale) => sum + sale.total, 0)

  const lowStock = products.filter((product) => product.stock <= product.minStock)

  const last7 = useMemo(() => {
    const days = []

    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = new Date()
      date.setDate(date.getDate() - offset)

      const key = date.toISOString().slice(0, 10)
      const label = date.toLocaleDateString('es-PE', { weekday: 'short' }).slice(0, 3)
      const total = sales.filter((sale) => sale.created_at.slice(0, 10) === key).reduce((sum, sale) => sum + sale.total, 0)

      days.push({ label, total: Number(total.toFixed(2)) })
    }

    return days
  }, [sales])

  const topProducts = useMemo(() => {
    const map = {}

    sales.forEach((sale) => {
      (sale.sale_items || []).forEach((item) => {
        map[item.product_name] = (map[item.product_name] || 0) + item.qty
      })
    })

    return Object.entries(map)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5)
  }, [sales])

  if (loading) {
    return <div style={{ textAlign: 'center', color: '#5f6b7a', padding: 40 }}>Cargando panel…</div>
  }

  return (
    <section style={{ display: 'grid', gap: 18 }}>
      {error && <div style={{ color: '#e14d5b', fontSize: 13 }}>{error}</div>}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 16,
        }}
      >
        <StatCard label="Ventas de hoy" value={fmt(totalToday)} sub={`${salesToday.length} transacciones`} icon={TrendingUp} tone="primary" />
        <StatCard label="Ventas del mes" value={fmt(totalMonth)} sub={`${salesMonth.length} transacciones`} icon={BarChart3} tone="accent" />
        <StatCard label="Productos" value={products.length} sub="en catálogo" icon={Package} tone="primary" />
        <StatCard label="Stock bajo" value={lowStock.length} sub="requieren reposición" icon={AlertTriangle} tone="danger" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
        <div
          style={{
            background: '#fff',
            border: '1px solid #e5eaf3',
            borderRadius: 18,
            padding: 18,
            boxShadow: '0 12px 28px rgba(23, 32, 51, 0.05)',
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 12 }}>Ventas · últimos 7 días</div>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={last7} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="#e5eaf3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#5f6b7a' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#5f6b7a' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value) => fmt(value)}
                  contentStyle={{ borderRadius: 10, border: '1px solid #e5eaf3', fontSize: 13 }}
                />
                <Bar dataKey="total" fill="#1E3A8A" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div
          style={{
            background: '#fff',
            border: '1px solid #e5eaf3',
            borderRadius: 18,
            padding: 18,
            boxShadow: '0 12px 28px rgba(23, 32, 51, 0.05)',
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 12 }}>Más vendidos</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {topProducts.length === 0 && <div style={{ color: '#5f6b7a', fontSize: 13 }}>Aún no hay ventas registradas.</div>}

            {topProducts.map((entry, index) => (
              <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#5f6b7a', width: 14 }}>{index + 1}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {entry.name}
                  </div>
                </div>
                <span
                  style={{
                    background: '#edf7f1',
                    color: '#1ea97c',
                    borderRadius: 999,
                    padding: '5px 8px',
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {entry.qty} und.
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {lowStock.length > 0 && (
        <div
          style={{
            background: '#fff',
            border: '1px solid rgba(225, 77, 91, 0.28)',
            borderRadius: 18,
            padding: 18,
            boxShadow: '0 12px 28px rgba(23, 32, 51, 0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#e14d5b', fontWeight: 800, fontSize: 15, marginBottom: 10 }}>
            <AlertTriangle size={16} /> Productos con stock bajo
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {lowStock.map((product) => (
              <span
                key={product.id}
                style={{
                  background: '#fff1f2',
                  color: '#c93d4e',
                  borderRadius: 999,
                  padding: '6px 10px',
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {product.name} · {product.stock} {unitShort(product)}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

function StatCard({ label, value, sub, icon: Icon, tone = 'primary' }) {
  const palette = {
    primary: { bg: 'rgba(47,111,237,0.12)', fg: '#2f6fed' },
    accent: { bg: 'rgba(22,163,74,0.12)', fg: '#16a34a' },
    danger: { bg: 'rgba(225,77,91,0.12)', fg: '#e14d5b' },
  }

  const color = palette[tone] || palette.primary

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e5eaf3',
        borderRadius: 18,
        padding: 18,
        boxShadow: '0 12px 28px rgba(23, 32, 51, 0.05)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div>
          <div style={{ color: '#5f6b7a', fontSize: 12, fontWeight: 600 }}>{label}</div>
          <div style={{ fontWeight: 800, fontSize: 24, marginTop: 8 }}>{value}</div>
          {sub && <div style={{ color: '#5f6b7a', fontSize: 12, marginTop: 4 }}>{sub}</div>}
        </div>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: color.bg,
          }}
        >
          <Icon size={18} color={color.fg} />
        </div>
      </div>
    </div>
  )
}
