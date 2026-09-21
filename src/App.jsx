import { useEffect, useMemo, useState } from 'react'
import {
  LayoutDashboard, ShoppingCart, Package, PackagePlus, BarChart3,
  Users, Receipt, UserCog, Truck,
} from 'lucide-react'
import './styles/tokens.css'
import { supabase } from './lib/supabase'
import { Sidebar } from './components/Sidebar'
import { Shell } from './components/Shell'
import { StatCard } from './components/StatCard'
import AuthModule from './features/auth'
import DashboardModule from './features/dashboard'
import PosModule from './features/pos'
import ProductosModule from './features/productos'
import IngresosModule from './features/ingresos'
import ProveedoresModule from './features/proveedores'
import InventarioModule from './features/inventario'
import ClientesModule from './features/clientes'
import ReportesModule from './features/reportes'
import MantenimientoModule from './features/mantenimiento'

const MODULES = [
  { id: 'dashboard', label: 'Panel', icon: LayoutDashboard },
  { id: 'pos', label: 'Vender', icon: ShoppingCart },
  { id: 'productos', label: 'Productos', icon: Package },
  { id: 'ingresos', label: 'Ingresos', icon: PackagePlus },
  { id: 'proveedores', label: 'Proveedores', icon: Truck },
  { id: 'inventario', label: 'Inventario', icon: BarChart3 },
  { id: 'clientes', label: 'Clientes', icon: Users },
  { id: 'reportes', label: 'Reportes', icon: Receipt },
  { id: 'mantenimiento', label: 'Mantenimiento', icon: UserCog },
]

const MODULE_COMPONENTS = {
  dashboard: DashboardModule,
  pos: PosModule,
  productos: ProductosModule,
  ingresos: IngresosModule,
  proveedores: ProveedoresModule,
  inventario: InventarioModule,
  clientes: ClientesModule,
  reportes: ReportesModule,
  mantenimiento: MantenimientoModule,
}

function fmt(value) {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(Number(value) || 0)
}

function App() {
  const [session, setSession] = useState(undefined)
  const [appUser, setAppUser] = useState(null)
  const [activeModule, setActiveModule] = useState('dashboard')
  const [stats, setStats] = useState({ salesToday: 0, salesMonth: 0, lowStock: 0, activeClients: 0 })

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })

    return () => subscription.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session?.user?.id) {
      setAppUser(null)
      return
    }

    supabase
      .from('app_users')
      .select('*, profiles(*)')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => setAppUser(data || null))
  }, [session?.user?.id])

  useEffect(() => {
    if (!session?.user?.id) return
    let active = true

    const now = new Date()
    const monthStartIso = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const todayStr = now.toISOString().slice(0, 10)

    Promise.all([
      supabase.from('sales').select('total, created_at').gte('created_at', monthStartIso).is('voided_at', null),
      supabase.from('products').select('stock, min_stock'),
      supabase.from('customers').select('id').eq('status', 'Activo'),
    ]).then(([salesRes, productsRes, customersRes]) => {
      if (!active) return

      const salesMonth = (salesRes.data || []).reduce((sum, sale) => sum + Number(sale.total || 0), 0)
      const salesToday = (salesRes.data || [])
        .filter((sale) => sale.created_at.slice(0, 10) === todayStr)
        .reduce((sum, sale) => sum + Number(sale.total || 0), 0)
      const lowStock = (productsRes.data || []).filter((product) => product.stock <= product.min_stock).length
      const activeClients = (customersRes.data || []).length

      setStats({ salesToday, salesMonth, lowStock, activeClients })
    })

    return () => {
      active = false
    }
  }, [session?.user?.id])

  const permissions = appUser?.profiles?.permissions || []
  const visibleModules = useMemo(
    () => MODULES.filter((module) => permissions.includes(module.id)),
    [permissions],
  )

  const activeId = visibleModules.some((module) => module.id === activeModule)
    ? activeModule
    : (visibleModules[0]?.id ?? 'dashboard')

  const ActiveComponent = MODULE_COMPONENTS[activeId] ?? DashboardModule

  function logout() {
    supabase.auth.signOut()
  }

  if (session === undefined) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: '#5f6b7a' }}>
        Cargando…
      </div>
    )
  }

  if (!session) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f5f7fb', padding: 20 }}>
        <AuthModule />
      </div>
    )
  }

  return (
    <div className="app-shell">
      <Sidebar
        items={visibleModules}
        activeId={activeId}
        onSelect={setActiveModule}
        userName={appUser?.name}
        profileName={appUser?.profiles?.name}
        onLogout={logout}
      />

      <div className="app-main">
        <div className="app-content">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 16,
              marginBottom: 24,
            }}
          >
            <StatCard label="Ventas del día" value={fmt(stats.salesToday)} tone="primary" />
            <StatCard label="Ingresos del mes" value={fmt(stats.salesMonth)} tone="success" />
            <StatCard label="Stock bajo" value={stats.lowStock} tone="warning" />
            <StatCard label="Clientes activos" value={stats.activeClients} tone="danger" />
          </div>

          <Shell title={MODULES.find((module) => module.id === activeId)?.label ?? 'Panel'}>
            <ActiveComponent />
          </Shell>
        </div>
      </div>
    </div>
  )
}

export default App
