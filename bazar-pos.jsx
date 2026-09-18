import { useState, useEffect, useMemo, useRef } from "react";
import {
  LayoutDashboard, ShoppingCart, Package, Users, BarChart3, Search,
  Plus, Minus, Trash2, X, Barcode, Banknote, CreditCard, Smartphone,
  AlertTriangle, Pencil, Check, TrendingUp, TrendingDown, ArrowUpCircle,
  ArrowDownCircle, ImageOff, UserRound, Receipt, PackagePlus, Truck,
  FileText, ChevronDown, Eye, LogOut, Lock, Mail, UserCog, ShieldCheck,
  UserPlus, Phone, ToggleLeft, ToggleRight, Store
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";

/* ---------------------------------------------------------------------
   Design tokens
--------------------------------------------------------------------- */
const TOKENS = `
  :root{
    --bg:#F4F6FA;
    --surface:#FFFFFF;
    --surface-2:#F7F8FB;
    --ink:#101828;
    --ink-soft:#4B5567;
    --ink-faint:#98A2B3;
    --border:#E3E6EC;
    --primary:#1E3A8A;
    --primary-ink:#FFFFFF;
    --primary-light:#E8ECFA;
    --accent:#0D9488;
    --accent-light:#E3F5F3;
    --danger:#DC2626;
    --danger-light:#FDECEC;
    --radius-sm:8px;
    --radius-md:14px;
    --radius-lg:20px;
    --shadow: 0 1px 2px rgba(16,24,40,0.05), 0 8px 24px -12px rgba(16,24,40,0.14);
  }
  .bazar-root{
    background:var(--bg); color:var(--ink); min-height:100%;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    display:flex; width:100%;
  }
  .bazar-heading{ font-family:'Manrope', 'Inter', sans-serif; }
  .bazar-nav{
    width:220px; flex-shrink:0; background:var(--primary); color:var(--primary-ink);
    display:flex; flex-direction:column; padding:20px 14px; gap:4px;
  }
  .bazar-nav-brand{
    font-family:'Manrope', sans-serif; font-weight:800; font-size:19px;
    padding:6px 10px 22px 10px; letter-spacing:-0.01em;
  }
  .bazar-nav-item{
    display:flex; align-items:center; gap:10px; padding:10px 12px;
    border-radius:var(--radius-sm); cursor:pointer; font-size:14px; font-weight:600;
    color:rgba(255,255,255,0.72); background:transparent; border:none; text-align:left;
    transition: background .15s ease, color .15s ease;
  }
  .bazar-nav-item:hover{ background:rgba(255,255,255,0.08); color:#fff; }
  .bazar-nav-item.active{ background:rgba(255,255,255,0.16); color:#fff; }
  .bazar-main{ flex:1; min-width:0; display:flex; flex-direction:column; }
  .bazar-topbar{
    padding:18px 28px; border-bottom:1px solid var(--border); background:var(--surface);
    display:flex; align-items:center; justify-content:space-between;
  }
  .bazar-content{ padding:24px 28px 90px 28px; flex:1; overflow-y:auto; }
  .card{
    background:var(--surface); border:1px solid var(--border); border-radius:var(--radius-md);
    padding:18px;
  }
  .btn{
    display:inline-flex; align-items:center; justify-content:center; gap:8px;
    font-weight:700; font-size:14px; border-radius:var(--radius-sm); padding:10px 16px;
    border:1px solid transparent; cursor:pointer; transition:filter .15s ease, background .15s ease;
    font-family:'Inter',sans-serif;
  }
  .btn:active{ filter:brightness(0.94); }
  .btn-primary{ background:var(--primary); color:#fff; }
  .btn-accent{ background:var(--accent); color:#FFFFFF; }
  .btn-outline{ background:transparent; color:var(--ink); border-color:var(--border); }
  .btn-outline:hover{ background:var(--surface-2); }
  .btn-danger{ background:var(--danger-light); color:var(--danger); }
  .btn-ghost{ background:transparent; color:var(--ink-soft); }
  .btn-ghost:hover{ background:var(--surface-2); }
  .btn:disabled{ opacity:0.45; cursor:not-allowed; }
  .input{
    width:100%; border:1px solid var(--border); border-radius:var(--radius-sm);
    padding:9px 12px; font-size:14px; background:var(--surface); color:var(--ink);
    font-family:'Inter',sans-serif;
  }
  .input:focus{ outline:2px solid var(--primary); outline-offset:0px; border-color:var(--primary); }
  label.field-label{ font-size:12px; font-weight:700; color:var(--ink-soft); margin-bottom:6px; display:block; }
  .badge{ display:inline-flex; align-items:center; gap:5px; font-size:12px; font-weight:700; padding:3px 9px; border-radius:999px; }
  .badge-ok{ background:var(--primary-light); color:var(--primary); }
  .badge-low{ background:var(--danger-light); color:var(--danger); }
  .badge-accent{ background:var(--accent-light); color:#0F766E; }
  table.data-table{ width:100%; border-collapse:collapse; font-size:14px; }
  table.data-table th{
    text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:0.04em;
    color:var(--ink-faint); font-weight:700; padding:8px 12px; border-bottom:1px solid var(--border);
  }
  table.data-table td{ padding:11px 12px; border-bottom:1px solid var(--border); vertical-align:middle; }
  table.data-table tr:last-child td{ border-bottom:none; }
  .modal-backdrop{
    position:fixed; inset:0; background:rgba(29,35,32,0.45); display:flex;
    align-items:center; justify-content:center; z-index:50; padding:16px;
  }
  .modal-panel{
    background:var(--surface); border-radius:var(--radius-lg); padding:24px;
    width:100%; max-width:440px; max-height:90vh; overflow-y:auto; box-shadow:var(--shadow);
  }
  .product-card{
    border:1px solid var(--border); border-radius:var(--radius-md); background:var(--surface);
    cursor:pointer; overflow:hidden; display:flex; flex-direction:column; transition:border-color .15s, transform .1s;
  }
  .product-card:hover{ border-color:var(--primary); }
  .product-card:active{ transform:scale(0.98); }
  .product-card.disabled{ opacity:0.4; cursor:not-allowed; }
  .product-thumb{
    width:100%; aspect-ratio:1/1; background:var(--surface-2); display:flex;
    align-items:center; justify-content:center; color:var(--ink-faint); overflow:hidden;
  }
  .product-thumb img{ width:100%; height:100%; object-fit:cover; }
  .bottom-nav{ display:none; }
  .stat-grid{ display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }
  .pos-grid{ display:grid; grid-template-columns: 1fr 340px; gap:18px; align-items:flex-start; }
  .products-grid{ display:grid; grid-template-columns:repeat(auto-fill,minmax(140px,1fr)); gap:12px; }
  .auth-screen{
    min-height:100%; width:100%; display:flex; align-items:center; justify-content:center;
    background: var(--primary); padding:20px;
  }
  .auth-card{
    background:var(--surface); border-radius:var(--radius-lg); padding:32px; width:100%; max-width:380px;
    box-shadow:var(--shadow);
  }
  .auth-tabs{ display:flex; gap:4px; background:var(--surface-2); padding:4px; border-radius:var(--radius-sm); margin-bottom:20px; }
  .auth-tab{
    flex:1; text-align:center; padding:8px; border-radius:6px; font-size:13px; font-weight:700; cursor:pointer;
    color:var(--ink-soft); background:none; border:none;
  }
  .auth-tab.active{ background:var(--surface); color:var(--primary); box-shadow:0 1px 2px rgba(0,0,0,0.06); }
  .tab-row{ display:flex; gap:6px; border-bottom:1px solid var(--border); margin-bottom:16px; }
  .tab-btn{
    padding:9px 14px; font-size:13.5px; font-weight:700; color:var(--ink-soft); background:none; border:none;
    cursor:pointer; border-bottom:2px solid transparent; margin-bottom:-1px;
  }
  .tab-btn.active{ color:var(--primary); border-color:var(--primary); }
  @media (max-width: 860px){
    .bazar-nav{ display:none; }
    .bazar-content{ padding:16px 16px 90px 16px; }
    .bazar-topbar{ padding:14px 16px; }
    .stat-grid{ grid-template-columns:repeat(2,1fr); }
    .pos-grid{ grid-template-columns:1fr; }
    .bottom-nav{
      display:flex; position:fixed; bottom:0; left:0; right:0; background:var(--primary);
      justify-content:space-around; padding:8px 4px 10px 4px; z-index:40;
      box-shadow:0 -4px 14px rgba(0,0,0,0.12);
    }
    .bottom-nav button{
      background:none; border:none; color:rgba(255,255,255,0.65); display:flex;
      flex-direction:column; align-items:center; gap:3px; font-size:10px; font-weight:700; padding:4px 6px;
    }
    .bottom-nav button.active{ color:#fff; }
  }
`;

/* ---------------------------------------------------------------------
   Helpers
--------------------------------------------------------------------- */
const fmt = (n) => `S/ ${Number(n || 0).toFixed(2)}`;
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const todayStr = () => new Date().toISOString().slice(0, 10);

const PAYMENTS = [
  { id: "efectivo", label: "Efectivo", icon: Banknote },
  { id: "tarjeta", label: "Tarjeta", icon: CreditCard },
  { id: "yape", label: "Yape", icon: Smartphone },
  { id: "plin", label: "Plin", icon: Smartphone },
];

const GENERIC_CUSTOMER = { id: "generic", name: "Cliente genérico", phone: "", doc: "" };

const DOC_TYPES = [
  { id: "boleta", label: "Boleta" },
  { id: "factura", label: "Factura" },
  { id: "guia", label: "Guía de remisión" },
  { id: "otro", label: "Otro" },
];

const UNIT_OPTIONS = [
  { id: "unidad", label: "Unidad", short: "und" },
  { id: "par", label: "Par", short: "par" },
  { id: "pack", label: "Pack", short: "pack" },
  { id: "caja", label: "Caja", short: "caja" },
  { id: "docena", label: "Docena", short: "doc" },
  { id: "litro", label: "Litro", short: "L" },
  { id: "kilogramo", label: "Kilogramo", short: "kg" },
  { id: "metro", label: "Metro", short: "m" },
  { id: "galon", label: "Galón", short: "gal" },
];
const unitShort = (product) => UNIT_OPTIONS.find((u) => u.id === product?.unit)?.short || "und";
const unitLabel = (id) => UNIT_OPTIONS.find((u) => u.id === id)?.label || "Unidad";

const CATEGORY_OPTIONS = [
  "Abarrotes",
  "Bebidas y licores",
  "Snacks y golosinas",
  "Limpieza y hogar",
  "Cuidado personal",
  "Útiles escolares y oficina",
  "Ferretería",
  "Juguetería y regalos",
  "Mascotas",
  "Bazar general",
];

const WEIGHT_UNITS = ["g", "kg", "ml", "L"];

/* --- Mantenimiento: perfiles, usuarios y sesión (prototipo) --- */
const MODULES = [
  { id: "dashboard", label: "Panel" },
  { id: "pos", label: "Vender" },
  { id: "productos", label: "Productos" },
  { id: "ingresos", label: "Ingresos" },
  { id: "inventario", label: "Inventario" },
  { id: "clientes", label: "Clientes" },
  { id: "reportes", label: "Reportes" },
  { id: "mantenimiento", label: "Mantenimiento" },
];

const DEFAULT_PROFILES = [
  { id: "admin", name: "Administrador", description: "Acceso completo a todos los módulos del sistema.", permissions: MODULES.map((m) => m.id) },
  { id: "vendedor", name: "Vendedor", description: "Atiende el punto de venta y gestiona clientes.", permissions: ["dashboard", "pos", "clientes"] },
  { id: "almacenero", name: "Almacenero", description: "Gestiona catálogo, ingresos de mercadería e inventario.", permissions: ["dashboard", "productos", "ingresos", "inventario"] },
];

// Hash simple para el prototipo (NO apto para producción). Al migrar a Supabase,
// la autenticación real (Supabase Auth) reemplaza este mecanismo.
const prototypeHash = (text) => btoa(unescape(encodeURIComponent(text || "")));

const SEED_USERS = [
  { id: uid(), name: "Administrador", email: "admin@bazar.pe", phone: "", profileId: "admin", active: true, passwordHash: prototypeHash("admin123"), createdAt: new Date().toISOString() },
];

const SEED_PRODUCTS = [
  { id: uid(), name: "Arroz Extra 1kg", barcode: "7750182001019", category: "Abarrotes", unit: "unidad", weight: "1", weightUnit: "kg", description: "Arroz extra grano largo, bolsa de 1kg.", costPrice: 3.2, salePrice: 4.5, stock: 42, minStock: 10, imageUrl: "" },
  { id: uid(), name: "Aceite Primor 1L", barcode: "7750182002214", category: "Abarrotes", unit: "litro", weight: "1", weightUnit: "L", description: "Aceite vegetal, botella de 1 litro.", costPrice: 9.8, salePrice: 13.5, stock: 18, minStock: 8, imageUrl: "" },
  { id: uid(), name: "Gaseosa Inca Kola 500ml", barcode: "7750182003311", category: "Bebidas y licores", unit: "unidad", weight: "500", weightUnit: "ml", description: "Gaseosa sabor original, botella de 500ml.", costPrice: 2.1, salePrice: 3.5, stock: 6, minStock: 12, imageUrl: "" },
  { id: uid(), name: "Galleta Soda Field", barcode: "7750182004427", category: "Snacks y golosinas", unit: "pack", weight: "6", weightUnit: "g", description: "Pack de galletas soda, 6 unidades.", costPrice: 1.1, salePrice: 1.8, stock: 60, minStock: 15, imageUrl: "" },
  { id: uid(), name: "Detergente Bolívar 500g", barcode: "7750182005539", category: "Limpieza y hogar", unit: "unidad", weight: "500", weightUnit: "g", description: "Detergente multiuso en polvo, bolsa de 500g.", costPrice: 4.0, salePrice: 6.0, stock: 3, minStock: 6, imageUrl: "" },
  { id: uid(), name: "Cuaderno A4 100h", barcode: "7750182006645", category: "Útiles escolares y oficina", unit: "unidad", weight: "", weightUnit: "g", description: "Cuaderno cuadriculado A4, 100 hojas.", costPrice: 3.5, salePrice: 5.5, stock: 25, minStock: 5, imageUrl: "" },
];

/* ---------------------------------------------------------------------
   Storage layer
--------------------------------------------------------------------- */
async function loadKey(key, fallback) {
  try {
    const res = await window.storage.get(key, false);
    if (res && res.value) return JSON.parse(res.value);
    return fallback;
  } catch {
    return fallback;
  }
}
async function saveKey(key, value) {
  try {
    await window.storage.set(key, JSON.stringify(value), false);
  } catch (e) {
    console.error("storage error", e);
  }
}

/* ---------------------------------------------------------------------
   Small shared components
--------------------------------------------------------------------- */
function Thumb({ url, name, size = "100%" }) {
  const initials = (name || "?").trim().slice(0, 2).toUpperCase();
  if (url) {
    return (
      <div className="product-thumb" style={{ width: size, height: size }}>
        <img src={url} alt={name} onError={(e) => { e.target.style.display = "none"; }} />
      </div>
    );
  }
  return (
    <div className="product-thumb" style={{ width: size, height: size }}>
      <span style={{ fontFamily: "Manrope, sans-serif", fontWeight: 800, fontSize: 18, color: "var(--primary)" }}>
        {initials}
      </span>
    </div>
  );
}

function StatCard({ label, value, sub, icon: Icon, tone = "primary" }) {
  const bg = tone === "danger" ? "var(--danger-light)" : tone === "accent" ? "var(--accent-light)" : "var(--primary-light)";
  const fg = tone === "danger" ? "var(--danger)" : tone === "accent" ? "#0F766E" : "var(--primary)";
  return (
    <div className="card">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-soft)" }}>{label}</span>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={15} color={fg} />
        </div>
      </div>
      <div className="bazar-heading" style={{ fontSize: 24, fontWeight: 800, marginTop: 10 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

/* ---------------------------------------------------------------------
   Dashboard
--------------------------------------------------------------------- */
function Dashboard({ products, sales }) {
  const today = todayStr();
  const salesToday = sales.filter((s) => s.date.slice(0, 10) === today);
  const totalToday = salesToday.reduce((a, s) => a + s.total, 0);

  const monthPrefix = today.slice(0, 7);
  const salesMonth = sales.filter((s) => s.date.slice(0, 7) === monthPrefix);
  const totalMonth = salesMonth.reduce((a, s) => a + s.total, 0);

  const lowStock = products.filter((p) => p.stock <= p.minStock);

  const last7 = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("es-PE", { weekday: "short" }).slice(0, 3);
      const total = sales.filter((s) => s.date.slice(0, 10) === key).reduce((a, s) => a + s.total, 0);
      days.push({ label, total: Number(total.toFixed(2)) });
    }
    return days;
  }, [sales]);

  const topProducts = useMemo(() => {
    const map = {};
    sales.forEach((s) => s.items.forEach((it) => {
      map[it.productId] = (map[it.productId] || 0) + it.qty;
    }));
    return Object.entries(map)
      .map(([id, qty]) => ({ product: products.find((p) => p.id === id), qty }))
      .filter((r) => r.product)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [sales, products]);

  return (
    <div>
      <div className="stat-grid">
        <StatCard label="Ventas de hoy" value={fmt(totalToday)} sub={`${salesToday.length} transacciones`} icon={TrendingUp} tone="primary" />
        <StatCard label="Ventas del mes" value={fmt(totalMonth)} sub={`${salesMonth.length} transacciones`} icon={BarChart3} tone="accent" />
        <StatCard label="Productos" value={products.length} sub="en catálogo" icon={Package} tone="primary" />
        <StatCard label="Stock bajo" value={lowStock.length} sub="requieren reposición" icon={AlertTriangle} tone="danger" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, marginTop: 18 }}>
        <div className="card">
          <div className="bazar-heading" style={{ fontWeight: 800, fontSize: 15, marginBottom: 12 }}>Ventas · últimos 7 días</div>
          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={last7} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: "var(--ink-soft)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--ink-faint)" }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => fmt(v)} contentStyle={{ borderRadius: 10, border: "1px solid var(--border)", fontSize: 13 }} />
                <Bar dataKey="total" fill="#1E3A8A" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="bazar-heading" style={{ fontWeight: 800, fontSize: 15, marginBottom: 12 }}>Más vendidos</div>
          {topProducts.length === 0 && <div style={{ fontSize: 13, color: "var(--ink-faint)" }}>Aún no hay ventas registradas.</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {topProducts.map((r, i) => (
              <div key={r.product.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: "var(--ink-faint)", width: 14 }}>{i + 1}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.product.name}</div>
                </div>
                <span className="badge badge-ok">{r.qty} {unitShort(r.product)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {lowStock.length > 0 && (
        <div className="card" style={{ marginTop: 16, borderColor: "var(--danger)" }}>
          <div className="bazar-heading" style={{ fontWeight: 800, fontSize: 15, marginBottom: 10, display: "flex", alignItems: "center", gap: 8, color: "var(--danger)" }}>
            <AlertTriangle size={16} /> Productos con stock bajo
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {lowStock.map((p) => (
              <span key={p.id} className="badge badge-low">{p.name} · {p.stock} {unitShort(p)}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------
   POS
--------------------------------------------------------------------- */
function POS({ products, customers, onSale }) {
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState([]); // {productId, qty}
  const [customerId, setCustomerId] = useState("generic");
  const [payment, setPayment] = useState("efectivo");
  const [cashReceived, setCashReceived] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [lastReceipt, setLastReceipt] = useState(null);
  const searchRef = useRef(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.barcode.includes(q));
  }, [query, products]);

  const cartLines = cart.map((c) => {
    const product = products.find((p) => p.id === c.productId);
    return product ? { ...c, product } : null;
  }).filter(Boolean);

  const total = cartLines.reduce((a, l) => a + l.product.salePrice * l.qty, 0);
  const received = parseFloat(cashReceived) || 0;
  const change = payment === "efectivo" ? Math.max(0, received - total) : 0;
  const canConfirm = cartLines.length > 0 && (payment !== "efectivo" || received >= total);

  function addToCart(product) {
    if (product.stock <= 0) return;
    setCart((prev) => {
      const existing = prev.find((c) => c.productId === product.id);
      const currentQty = existing ? existing.qty : 0;
      if (currentQty >= product.stock) return prev;
      if (existing) return prev.map((c) => (c.productId === product.id ? { ...c, qty: c.qty + 1 } : c));
      return [...prev, { productId: product.id, qty: 1 }];
    });
  }
  function changeQty(productId, delta) {
    setCart((prev) => prev.map((c) => {
      if (c.productId !== productId) return c;
      const product = products.find((p) => p.id === productId);
      const nextQty = Math.min(product?.stock ?? c.qty, c.qty + delta);
      return { ...c, qty: nextQty };
    }).map((c) => ({ ...c, qty: Math.max(1, c.qty) })));
  }
  function removeLine(productId) {
    setCart((prev) => prev.filter((c) => c.productId !== productId));
  }

  function handleSearchKeyDown(e) {
    if (e.key === "Enter") {
      const q = query.trim().toLowerCase();
      const exact = products.find((p) => p.barcode === q);
      if (exact) {
        addToCart(exact);
        setQuery("");
      }
    }
  }

  function confirmSale() {
    if (!canConfirm) return;
    const sale = {
      id: uid(),
      date: new Date().toISOString(),
      items: cartLines.map((l) => ({ productId: l.productId, name: l.product.name, qty: l.qty, price: l.product.salePrice })),
      customerId,
      customerName: customerId === "generic" ? GENERIC_CUSTOMER.name : (customers.find((c) => c.id === customerId)?.name || GENERIC_CUSTOMER.name),
      payment,
      total,
      cashReceived: payment === "efectivo" ? received : null,
      change: payment === "efectivo" ? change : null,
    };
    onSale(sale);
    setLastReceipt(sale);
    setCart([]);
    setCashReceived("");
    setCustomerId("generic");
    setPayment("efectivo");
    setConfirming(false);
  }

  return (
    <div className="pos-grid">
      <div>
        <div style={{ position: "relative", marginBottom: 14 }}>
          <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink-faint)" }} />
          <input
            ref={searchRef}
            className="input"
            style={{ paddingLeft: 36 }}
            placeholder="Buscar por nombre o código de barras…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
          <Barcode size={16} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink-faint)" }} />
        </div>

        <div className="products-grid">
          {filtered.map((p) => {
            const inCartQty = cart.find((c) => c.productId === p.id)?.qty || 0;
            const disabled = p.stock <= 0 || inCartQty >= p.stock;
            return (
              <div key={p.id} className={`product-card${disabled ? " disabled" : ""}`} onClick={() => !disabled && addToCart(p)}>
                <Thumb url={p.imageUrl} name={p.name} />
                <div style={{ padding: "8px 10px 10px 10px" }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, lineHeight: 1.25, minHeight: 32, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{p.name}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                    <span style={{ fontWeight: 800, fontSize: 13.5, color: "var(--primary)" }}>{fmt(p.salePrice)}</span>
                    <span style={{ fontSize: 11, color: p.stock <= p.minStock ? "var(--danger)" : "var(--ink-faint)", fontWeight: 700 }}>{p.stock} {unitShort(p)}</span>
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 40, color: "var(--ink-faint)", fontSize: 14 }}>
              No se encontraron productos.
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ position: "sticky", top: 0, display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="bazar-heading" style={{ fontWeight: 800, fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
          <ShoppingCart size={17} /> Carrito
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 260, overflowY: "auto" }}>
          {cartLines.length === 0 && <div style={{ fontSize: 13, color: "var(--ink-faint)" }}>Agrega productos tocando una tarjeta.</div>}
          {cartLines.map((l) => (
            <div key={l.productId} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.product.name}</div>
                <div style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>{fmt(l.product.salePrice)} c/u</div>
              </div>
              <button className="btn btn-ghost" style={{ padding: 4 }} onClick={() => changeQty(l.productId, -1)}><Minus size={13} /></button>
              <span style={{ fontSize: 13, fontWeight: 700, width: 18, textAlign: "center" }}>{l.qty}</span>
              <button className="btn btn-ghost" style={{ padding: 4 }} onClick={() => changeQty(l.productId, 1)}><Plus size={13} /></button>
              <button className="btn btn-ghost" style={{ padding: 4, color: "var(--danger)" }} onClick={() => removeLine(l.productId)}><Trash2 size={13} /></button>
            </div>
          ))}
        </div>

        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 10 }}>
          <label className="field-label">Cliente</label>
          <select className="input" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
            <option value="generic">Cliente genérico</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div>
          <label className="field-label">Método de pago</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {PAYMENTS.map((m) => (
              <button
                key={m.id}
                className="btn"
                style={{
                  background: payment === m.id ? "var(--primary)" : "var(--surface-2)",
                  color: payment === m.id ? "#fff" : "var(--ink)",
                  border: "1px solid " + (payment === m.id ? "var(--primary)" : "var(--border)"),
                  fontSize: 12.5,
                }}
                onClick={() => setPayment(m.id)}
              >
                <m.icon size={14} /> {m.label}
              </button>
            ))}
          </div>
        </div>

        {payment === "efectivo" && (
          <div>
            <label className="field-label">Monto recibido</label>
            <input
              className="input"
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              value={cashReceived}
              onChange={(e) => setCashReceived(e.target.value)}
            />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 13 }}>
              <span style={{ color: "var(--ink-soft)" }}>Vuelto</span>
              <span style={{ fontWeight: 800, color: received >= total && total > 0 ? "var(--primary)" : "var(--ink-faint)" }}>{fmt(change)}</span>
            </div>
          </div>
        )}

        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 10, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-soft)" }}>Total</span>
          <span className="bazar-heading" style={{ fontSize: 24, fontWeight: 800 }}>{fmt(total)}</span>
        </div>

        <button className="btn btn-accent" disabled={!canConfirm} onClick={confirmSale}>
          <Check size={16} /> Cobrar {total > 0 ? fmt(total) : ""}
        </button>
      </div>

      {lastReceipt && (
        <div className="modal-backdrop" onClick={() => setLastReceipt(null)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div className="bazar-heading" style={{ fontWeight: 800, fontSize: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <Receipt size={18} color="var(--primary)" /> Venta registrada
              </div>
              <button className="btn btn-ghost" style={{ padding: 6 }} onClick={() => setLastReceipt(null)}><X size={16} /></button>
            </div>
            <div style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 10 }}>{lastReceipt.customerName} · {new Date(lastReceipt.date).toLocaleString("es-PE")}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
              {lastReceipt.items.map((it) => (
                <div key={it.productId} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span>{it.qty}× {it.name}</span>
                  <span style={{ fontWeight: 700 }}>{fmt(it.qty * it.price)}</span>
                </div>
              ))}
            </div>
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 10, display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 700 }}>Total</span>
              <span className="bazar-heading" style={{ fontWeight: 800, fontSize: 18 }}>{fmt(lastReceipt.total)}</span>
            </div>
            {lastReceipt.payment === "efectivo" && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginTop: 6, color: "var(--ink-soft)" }}>
                <span>Recibido {fmt(lastReceipt.cashReceived)}</span>
                <span>Vuelto {fmt(lastReceipt.change)}</span>
              </div>
            )}
            <button className="btn btn-primary" style={{ width: "100%", marginTop: 16 }} onClick={() => setLastReceipt(null)}>Nueva venta</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------
   Productos
--------------------------------------------------------------------- */
function emptyProduct() {
  return {
    id: null, name: "", barcode: "", category: "", unit: "unidad",
    weight: "", weightUnit: "g", description: "",
    costPrice: "", salePrice: "", stock: "", minStock: "", imageUrl: "",
  };
}

function ProductForm({ initial, onCancel, onSave }) {
  const [form, setForm] = useState(initial);
  const isKnownCategory = CATEGORY_OPTIONS.includes(initial.category);
  const [categoryChoice, setCategoryChoice] = useState(isKnownCategory ? initial.category : (initial.category ? "otra" : ""));
  const [customCategory, setCustomCategory] = useState(isKnownCategory ? "" : initial.category);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const margin = form.salePrice && form.costPrice ? (((form.salePrice - form.costPrice) / form.salePrice) * 100).toFixed(0) : null;

  function submit() {
    if (!form.name || form.salePrice === "") return;
    const category = categoryChoice === "otra" ? customCategory.trim() : categoryChoice;
    onSave({
      ...form,
      id: form.id || uid(),
      category,
      unit: form.unit || "unidad",
      weight: form.weight,
      weightUnit: form.weightUnit || "g",
      description: form.description,
      costPrice: parseFloat(form.costPrice) || 0,
      salePrice: parseFloat(form.salePrice) || 0,
      stock: parseInt(form.stock) || 0,
      minStock: parseInt(form.minStock) || 0,
    });
  }

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div className="bazar-heading" style={{ fontWeight: 800, fontSize: 16 }}>{form.id ? "Editar producto" : "Nuevo producto"}</div>
          <button className="btn btn-ghost" style={{ padding: 6 }} onClick={onCancel}><X size={16} /></button>
        </div>

        <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
          <Thumb url={form.imageUrl} name={form.name} size="64px" />
          <div style={{ flex: 1 }}>
            <label className="field-label">URL de imagen referencial</label>
            <input className="input" placeholder="https://…" value={form.imageUrl} onChange={set("imageUrl")} />
          </div>
        </div>

        <label className="field-label">Nombre</label>
        <input className="input" style={{ marginBottom: 10 }} value={form.name} onChange={set("name")} placeholder="Ej. Arroz Extra 1kg" />

        <label className="field-label">Descripción</label>
        <textarea
          className="input"
          style={{ marginBottom: 10, minHeight: 64, resize: "vertical", fontFamily: "inherit" }}
          value={form.description}
          onChange={set("description")}
          placeholder="Detalles del producto: presentación, marca, características…"
        />

        <div style={{ marginBottom: 10 }}>
          <label className="field-label">Categoría</label>
          <select className="input" value={categoryChoice} onChange={(e) => setCategoryChoice(e.target.value)}>
            <option value="">Selecciona una categoría</option>
            {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            <option value="otra">Otra…</option>
          </select>
          {categoryChoice === "otra" && (
            <input
              className="input"
              style={{ marginTop: 8 }}
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              placeholder="Especifica la categoría"
            />
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
          <div>
            <label className="field-label">Código de barras</label>
            <input className="input" value={form.barcode} onChange={set("barcode")} placeholder="Opcional" />
          </div>
          <div>
            <label className="field-label">Unidad de venta</label>
            <select className="input" value={form.unit} onChange={set("unit")}>
              {UNIT_OPTIONS.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 10 }}>
          <label className="field-label">Peso / contenido</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 100px", gap: 10 }}>
            <input className="input" type="number" inputMode="decimal" value={form.weight} onChange={set("weight")} placeholder="Ej. 500" />
            <select className="input" value={form.weightUnit} onChange={set("weightUnit")}>
              {WEIGHT_UNITS.map((w) => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
          <div>
            <label className="field-label">Precio de compra</label>
            <input className="input" type="number" inputMode="decimal" value={form.costPrice} onChange={set("costPrice")} placeholder="0.00" />
          </div>
          <div>
            <label className="field-label">Precio de venta</label>
            <input className="input" type="number" inputMode="decimal" value={form.salePrice} onChange={set("salePrice")} placeholder="0.00" />
          </div>
        </div>
        {margin !== null && (
          <div style={{ fontSize: 12, color: "var(--ink-faint)", marginBottom: 10 }}>Margen aproximado: <strong style={{ color: "var(--primary)" }}>{margin}%</strong></div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
          <div>
            <label className="field-label">Stock actual ({unitLabel(form.unit)})</label>
            <input className="input" type="number" value={form.stock} onChange={set("stock")} placeholder="0" />
          </div>
          <div>
            <label className="field-label">Stock mínimo</label>
            <input className="input" type="number" value={form.minStock} onChange={set("minStock")} placeholder="0" />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={onCancel}>Cancelar</button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={submit}>Guardar</button>
        </div>
      </div>
    </div>
  );
}

function Productos({ products, onSave, onDelete }) {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase()) || p.barcode.includes(query)
  );

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink-faint)" }} />
          <input className="input" style={{ paddingLeft: 34 }} placeholder="Buscar producto o código…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={() => setEditing(emptyProduct())}><Plus size={16} /> Nuevo producto</button>
      </div>

      <div className="card" style={{ padding: 0, overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th></th>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Compra</th>
              <th>Venta</th>
              <th>Stock</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td><Thumb url={p.imageUrl} name={p.name} size="36px" /></td>
                <td>
                  <div style={{ fontWeight: 700 }}>{p.name}</div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>
                    {p.barcode || "sin código"}{p.weight ? ` · ${p.weight}${p.weightUnit}` : ""}
                  </div>
                </td>
                <td style={{ color: "var(--ink-soft)" }}>{p.category || "—"}</td>
                <td>{fmt(p.costPrice)}</td>
                <td style={{ fontWeight: 700 }}>{fmt(p.salePrice)}</td>
                <td>
                  <span className={`badge ${p.stock <= p.minStock ? "badge-low" : "badge-ok"}`}>{p.stock} {unitShort(p)}</span>
                </td>
                <td>
                  <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                    <button className="btn btn-ghost" style={{ padding: 6 }} onClick={() => setEditing(p)}><Pencil size={14} /></button>
                    <button className="btn btn-ghost" style={{ padding: 6, color: "var(--danger)" }} onClick={() => onDelete(p.id)}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: "center", padding: 30, color: "var(--ink-faint)" }}>No hay productos.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <ProductForm
          initial={editing}
          onCancel={() => setEditing(null)}
          onSave={(p) => { onSave(p); setEditing(null); }}
        />
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------
   Inventario
--------------------------------------------------------------------- */
function AdjustModal({ product, onCancel, onConfirm }) {
  const [type, setType] = useState("entrada");
  const [qty, setQty] = useState("");
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 360 }}>
        <div className="bazar-heading" style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>Ajustar stock</div>
        <div style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 16 }}>{product.name} · stock actual {product.stock}</div>

        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <button className="btn" style={{ flex: 1, background: type === "entrada" ? "var(--primary-light)" : "var(--surface-2)", color: type === "entrada" ? "var(--primary)" : "var(--ink)", border: "1px solid var(--border)" }} onClick={() => setType("entrada")}>
            <ArrowUpCircle size={15} /> Entrada
          </button>
          <button className="btn" style={{ flex: 1, background: type === "salida" ? "var(--danger-light)" : "var(--surface-2)", color: type === "salida" ? "var(--danger)" : "var(--ink)", border: "1px solid var(--border)" }} onClick={() => setType("salida")}>
            <ArrowDownCircle size={15} /> Salida
          </button>
        </div>

        <label className="field-label">Cantidad</label>
        <input className="input" type="number" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="0" style={{ marginBottom: 18 }} />

        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={onCancel}>Cancelar</button>
          <button
            className="btn btn-primary"
            style={{ flex: 1 }}
            disabled={!qty || parseInt(qty) <= 0}
            onClick={() => onConfirm(type === "entrada" ? parseInt(qty) : -parseInt(qty))}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

function Inventario({ products, onAdjust }) {
  const [adjusting, setAdjusting] = useState(null);
  const sorted = [...products].sort((a, b) => (a.stock <= a.minStock ? -1 : 1) - (b.stock <= b.minStock ? -1 : 1));

  return (
    <div>
      <div className="card" style={{ padding: 0, overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Stock</th>
              <th>Mínimo</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => {
              const low = p.stock <= p.minStock;
              return (
                <tr key={p.id}>
                  <td style={{ fontWeight: 700 }}>{p.name}</td>
                  <td style={{ color: "var(--ink-soft)" }}>{p.category || "—"}</td>
                  <td>{p.stock} {unitShort(p)}</td>
                  <td style={{ color: "var(--ink-faint)" }}>{p.minStock} {unitShort(p)}</td>
                  <td><span className={`badge ${low ? "badge-low" : "badge-ok"}`}>{low ? "Stock bajo" : "Suficiente"}</span></td>
                  <td>
                    <button className="btn btn-outline" style={{ fontSize: 12.5 }} onClick={() => setAdjusting(p)}>Ajustar</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {adjusting && (
        <AdjustModal
          product={adjusting}
          onCancel={() => setAdjusting(null)}
          onConfirm={(delta) => { onAdjust(adjusting.id, delta); setAdjusting(null); }}
        />
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------
   Ingreso de productos (compras a proveedor)
--------------------------------------------------------------------- */
function Ingresos({ products, receipts, onReceive }) {
  const [query, setQuery] = useState("");
  const [lines, setLines] = useState([]); // {productId, qty, costPrice}
  const [docType, setDocType] = useState("boleta");
  const [docNumber, setDocNumber] = useState("");
  const [supplier, setSupplier] = useState("");
  const [date, setDate] = useState(todayStr());
  const [showHistory, setShowHistory] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.barcode.includes(q)).slice(0, 8);
  }, [query, products]);

  function addLine(product) {
    setLines((prev) => {
      if (prev.some((l) => l.productId === product.id)) return prev;
      return [...prev, { productId: product.id, qty: 1, costPrice: product.costPrice }];
    });
    setQuery("");
  }

  function handleSearchKeyDown(e) {
    if (e.key === "Enter") {
      const q = query.trim().toLowerCase();
      const exact = products.find((p) => p.barcode === q);
      if (exact) addLine(exact);
    }
  }

  function updateLine(productId, field, value) {
    setLines((prev) => prev.map((l) => (l.productId === productId ? { ...l, [field]: value } : l)));
  }
  function removeLine(productId) {
    setLines((prev) => prev.filter((l) => l.productId !== productId));
  }

  const totalUnits = lines.reduce((a, l) => a + (parseInt(l.qty) || 0), 0);
  const totalCost = lines.reduce((a, l) => a + (parseInt(l.qty) || 0) * (parseFloat(l.costPrice) || 0), 0);
  const canConfirm = lines.length > 0 && lines.every((l) => (parseInt(l.qty) || 0) > 0) && docNumber.trim() !== "";

  function confirm() {
    if (!canConfirm) return;
    const receipt = {
      id: uid(),
      date: new Date(date).toISOString(),
      docType,
      docNumber: docNumber.trim(),
      supplier: supplier.trim() || "Sin especificar",
      items: lines.map((l) => {
        const product = products.find((p) => p.id === l.productId);
        return { productId: l.productId, name: product?.name || "", qty: parseInt(l.qty) || 0, costPrice: parseFloat(l.costPrice) || 0 };
      }),
      totalUnits,
      totalCost,
    };
    onReceive(receipt);
    setViewingReceipt(receipt);
    setLines([]);
    setDocNumber("");
    setSupplier("");
    setDate(todayStr());
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>Registra el documento del proveedor y los productos recibidos para actualizar tu stock.</div>
        <button className="btn btn-outline" onClick={() => setShowHistory((v) => !v)}>
          <FileText size={15} /> {showHistory ? "Ocultar historial" : "Ver historial"}
        </button>
      </div>

      {showHistory ? (
        <div className="card" style={{ padding: 0, overflowX: "auto" }}>
          <table className="data-table">
            <thead><tr><th>Fecha</th><th>Documento</th><th>Proveedor</th><th>Ítems</th><th>Costo total</th><th></th></tr></thead>
            <tbody>
              {[...receipts].reverse().map((r) => (
                <tr key={r.id}>
                  <td>{new Date(r.date).toLocaleDateString("es-PE")}</td>
                  <td><span className="badge badge-accent">{DOC_TYPES.find((d) => d.id === r.docType)?.label || r.docType}</span> {r.docNumber}</td>
                  <td style={{ color: "var(--ink-soft)" }}>{r.supplier}</td>
                  <td>{r.totalUnits} und</td>
                  <td style={{ fontWeight: 700 }}>{fmt(r.totalCost)}</td>
                  <td>
                    <button className="btn btn-outline" style={{ fontSize: 12.5 }} onClick={() => setViewingReceipt(r)}>
                      <Eye size={14} /> Ver detalle
                    </button>
                  </td>
                </tr>
              ))}
              {receipts.length === 0 && <tr><td colSpan={6} style={{ textAlign: "center", padding: 30, color: "var(--ink-faint)" }}>Aún no registras ingresos de mercadería.</td></tr>}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="pos-grid">
          <div className="card">
            <div className="bazar-heading" style={{ fontWeight: 800, fontSize: 15, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <Truck size={17} /> Datos del comprobante
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <div>
                <label className="field-label">Tipo de documento</label>
                <select className="input" value={docType} onChange={(e) => setDocType(e.target.value)}>
                  {DOC_TYPES.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
                </select>
              </div>
              <div>
                <label className="field-label">N° de documento</label>
                <input className="input" value={docNumber} onChange={(e) => setDocNumber(e.target.value)} placeholder="Ej. F001-2045" />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              <div>
                <label className="field-label">Proveedor</label>
                <input className="input" value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Nombre del proveedor" />
              </div>
              <div>
                <label className="field-label">Fecha</label>
                <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
            </div>

            <div style={{ position: "relative", marginBottom: 12 }}>
              <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink-faint)" }} />
              <input
                className="input"
                style={{ paddingLeft: 36 }}
                placeholder="Buscar producto por nombre o código de barras…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
              {filtered.length > 0 && (
                <div className="card" style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 10, padding: 6, maxHeight: 240, overflowY: "auto" }}>
                  {filtered.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => addLine(p)}
                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 8px", borderRadius: 8, cursor: "pointer" }}
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      <Thumb url={p.imageUrl} name={p.name} size="30px" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: "var(--ink-faint)" }}>{p.barcode || "sin código"} · stock {p.stock}</div>
                      </div>
                      <Plus size={14} color="var(--primary)" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {lines.length === 0 && <div style={{ fontSize: 13, color: "var(--ink-faint)" }}>Busca productos para agregarlos al ingreso.</div>}
              {lines.map((l) => {
                const product = products.find((p) => p.id === l.productId);
                if (!product) return null;
                return (
                  <div key={l.productId} style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid var(--border)", borderRadius: 10, padding: "8px 10px" }}>
                    <Thumb url={product.imageUrl} name={product.name} size="34px" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{product.name}</div>
                      <div style={{ fontSize: 11, color: "var(--ink-faint)" }}>Stock actual {product.stock} {unitShort(product)}</div>
                    </div>
                    <div style={{ width: 78 }}>
                      <label className="field-label" style={{ marginBottom: 2 }}>Cant. ({unitShort(product)})</label>
                      <input className="input" type="number" min="1" value={l.qty} onChange={(e) => updateLine(l.productId, "qty", e.target.value)} />
                    </div>
                    <div style={{ width: 90 }}>
                      <label className="field-label" style={{ marginBottom: 2 }}>Costo c/u</label>
                      <input className="input" type="number" step="0.01" value={l.costPrice} onChange={(e) => updateLine(l.productId, "costPrice", e.target.value)} />
                    </div>
                    <button className="btn btn-ghost" style={{ padding: 4, color: "var(--danger)" }} onClick={() => removeLine(l.productId)}><Trash2 size={14} /></button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card" style={{ position: "sticky", top: 0, display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="bazar-heading" style={{ fontWeight: 800, fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
              <PackagePlus size={17} /> Resumen del ingreso
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: "var(--ink-soft)" }}>Productos distintos</span>
              <span style={{ fontWeight: 700 }}>{lines.length}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: "var(--ink-soft)" }}>Unidades a ingresar</span>
              <span style={{ fontWeight: 700 }}>{totalUnits}</span>
            </div>
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 10, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-soft)" }}>Costo total</span>
              <span className="bazar-heading" style={{ fontSize: 22, fontWeight: 800 }}>{fmt(totalCost)}</span>
            </div>
            {!docNumber.trim() && lines.length > 0 && (
              <div style={{ fontSize: 12, color: "var(--danger)" }}>Falta el N° de documento del proveedor.</div>
            )}
            <button className="btn btn-accent" disabled={!canConfirm} onClick={confirm}>
              <Check size={16} /> Registrar ingreso
            </button>
          </div>
        </div>
      )}

      {viewingReceipt && (
        <div className="modal-backdrop" onClick={() => setViewingReceipt(null)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div className="bazar-heading" style={{ fontWeight: 800, fontSize: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <PackagePlus size={18} color="var(--primary)" /> Detalle del ingreso
              </div>
              <button className="btn btn-ghost" style={{ padding: 6 }} onClick={() => setViewingReceipt(null)}><X size={16} /></button>
            </div>
            <div style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 4 }}>
              {DOC_TYPES.find((d) => d.id === viewingReceipt.docType)?.label} {viewingReceipt.docNumber} · {viewingReceipt.supplier}
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-faint)", marginBottom: 12 }}>
              {new Date(viewingReceipt.date).toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" })}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12, maxHeight: 260, overflowY: "auto" }}>
              {viewingReceipt.items.map((it) => (
                <div key={it.productId} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, gap: 10 }}>
                  <span style={{ flex: 1 }}>{it.qty}× {it.name}</span>
                  <span style={{ color: "var(--ink-faint)" }}>{fmt(it.costPrice)} c/u</span>
                  <span style={{ fontWeight: 700, width: 70, textAlign: "right" }}>{fmt(it.qty * it.costPrice)}</span>
                </div>
              ))}
            </div>
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 10, display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 700 }}>Unidades ingresadas</span>
              <span className="bazar-heading" style={{ fontWeight: 800 }}>{viewingReceipt.totalUnits} und</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
              <span style={{ fontWeight: 700 }}>Costo total</span>
              <span className="bazar-heading" style={{ fontWeight: 800 }}>{fmt(viewingReceipt.totalCost)}</span>
            </div>
            <button className="btn btn-primary" style={{ width: "100%", marginTop: 16 }} onClick={() => setViewingReceipt(null)}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------
   Clientes
--------------------------------------------------------------------- */
function emptyCustomer() { return { id: null, name: "", email: "", phone: "", doc: "" }; }

function CustomerForm({ initial, onCancel, onSave }) {
  const [form, setForm] = useState(initial);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 380 }}>
        <div className="bazar-heading" style={{ fontWeight: 800, fontSize: 16, marginBottom: 16 }}>{form.id ? "Editar cliente" : "Nuevo cliente"}</div>
        <label className="field-label">Nombre completo</label>
        <input className="input" style={{ marginBottom: 10 }} value={form.name} onChange={set("name")} placeholder="Ej. María Torres" />
        <label className="field-label">Correo electrónico</label>
        <input className="input" style={{ marginBottom: 10 }} type="email" value={form.email} onChange={set("email")} placeholder="Opcional" />
        <label className="field-label">Teléfono</label>
        <input className="input" style={{ marginBottom: 10 }} value={form.phone} onChange={set("phone")} placeholder="Opcional" />
        <label className="field-label">DNI / RUC</label>
        <input className="input" style={{ marginBottom: 18 }} value={form.doc} onChange={set("doc")} placeholder="Opcional" />
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={onCancel}>Cancelar</button>
          <button className="btn btn-primary" style={{ flex: 1 }} disabled={!form.name} onClick={() => onSave({ ...form, id: form.id || uid() })}>Guardar</button>
        </div>
      </div>
    </div>
  );
}

function Clientes({ customers, sales, onSave, onDelete }) {
  const [editing, setEditing] = useState(null);
  const spentBy = (id) => sales.filter((s) => s.customerId === id).reduce((a, s) => a + s.total, 0);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <button className="btn btn-primary" onClick={() => setEditing(emptyCustomer())}><Plus size={16} /> Nuevo cliente</button>
      </div>
      <div className="card" style={{ padding: 0, overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr><th>Cliente</th><th>Correo</th><th>Teléfono</th><th>Doc.</th><th>Compras</th><th></th></tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700 }}><UserRound size={14} color="var(--ink-faint)" /> Cliente genérico</td>
              <td colSpan={3} style={{ color: "var(--ink-faint)" }}>Ventas sin registrar cliente</td>
              <td style={{ fontWeight: 700 }}>{fmt(spentBy("generic"))}</td>
              <td></td>
            </tr>
            {customers.map((c) => (
              <tr key={c.id}>
                <td style={{ fontWeight: 700 }}>{c.name}</td>
                <td style={{ color: "var(--ink-soft)" }}>{c.email || "—"}</td>
                <td style={{ color: "var(--ink-soft)" }}>{c.phone || "—"}</td>
                <td style={{ color: "var(--ink-soft)" }}>{c.doc || "—"}</td>
                <td style={{ fontWeight: 700 }}>{fmt(spentBy(c.id))}</td>
                <td>
                  <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                    <button className="btn btn-ghost" style={{ padding: 6 }} onClick={() => setEditing(c)}><Pencil size={14} /></button>
                    <button className="btn btn-ghost" style={{ padding: 6, color: "var(--danger)" }} onClick={() => onDelete(c.id)}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: 30, color: "var(--ink-faint)" }}>Aún no registras clientes.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {editing && <CustomerForm initial={editing} onCancel={() => setEditing(null)} onSave={(c) => { onSave(c); setEditing(null); }} />}
    </div>
  );
}

/* ---------------------------------------------------------------------
   Reportes
--------------------------------------------------------------------- */
function Reportes({ sales, products }) {
  const [range, setRange] = useState("7d");

  const filtered = useMemo(() => {
    const now = new Date();
    return sales.filter((s) => {
      if (range === "all") return true;
      const d = new Date(s.date);
      const days = range === "hoy" ? 0 : range === "7d" ? 7 : 30;
      const cutoff = new Date(now);
      cutoff.setDate(cutoff.getDate() - days);
      cutoff.setHours(0, 0, 0, 0);
      return d >= cutoff;
    });
  }, [sales, range]);

  const totalRevenue = filtered.reduce((a, s) => a + s.total, 0);
  const avgTicket = filtered.length ? totalRevenue / filtered.length : 0;

  const byDay = useMemo(() => {
    const map = {};
    filtered.forEach((s) => {
      const key = s.date.slice(0, 10);
      map[key] = (map[key] || 0) + s.total;
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([date, total]) => ({
      label: new Date(date).toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit" }),
      total: Number(total.toFixed(2)),
    }));
  }, [filtered]);

  const topProducts = useMemo(() => {
    const map = {};
    filtered.forEach((s) => s.items.forEach((it) => {
      if (!map[it.productId]) map[it.productId] = { name: it.name, qty: 0, revenue: 0 };
      map[it.productId].qty += it.qty;
      map[it.productId].revenue += it.qty * it.price;
    }));
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  }, [filtered]);

  const byPayment = useMemo(() => {
    const map = {};
    filtered.forEach((s) => { map[s.payment] = (map[s.payment] || 0) + s.total; });
    return PAYMENTS.map((m) => ({ ...m, total: map[m.id] || 0 }));
  }, [filtered]);

  const ranges = [
    { id: "hoy", label: "Hoy" },
    { id: "7d", label: "7 días" },
    { id: "30d", label: "30 días" },
    { id: "all", label: "Todo" },
  ];

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {ranges.map((r) => (
          <button
            key={r.id}
            className="btn"
            style={{ background: range === r.id ? "var(--primary)" : "var(--surface-2)", color: range === r.id ? "#fff" : "var(--ink)", border: "1px solid var(--border)", fontSize: 13 }}
            onClick={() => setRange(r.id)}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="stat-grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        <StatCard label="Ingresos" value={fmt(totalRevenue)} icon={TrendingUp} tone="primary" />
        <StatCard label="Transacciones" value={filtered.length} icon={Receipt} tone="accent" />
        <StatCard label="Ticket promedio" value={fmt(avgTicket)} icon={BarChart3} tone="primary" />
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="bazar-heading" style={{ fontWeight: 800, fontSize: 15, marginBottom: 12 }}>Ingresos por día</div>
        <div style={{ width: "100%", height: 220 }}>
          <ResponsiveContainer>
            <BarChart data={byDay} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--ink-soft)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--ink-faint)" }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => fmt(v)} contentStyle={{ borderRadius: 10, border: "1px solid var(--border)", fontSize: 13 }} />
              <Bar dataKey="total" fill="#0D9488" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16, marginTop: 16 }}>
        <div className="card" style={{ padding: 0, overflowX: "auto" }}>
          <div className="bazar-heading" style={{ fontWeight: 800, fontSize: 15, padding: "16px 18px 6px 18px" }}>Productos más vendidos</div>
          <table className="data-table">
            <thead><tr><th>Producto</th><th>Cant.</th><th>Ingresos</th></tr></thead>
            <tbody>
              {topProducts.map((p) => (
                <tr key={p.name}><td style={{ fontWeight: 700 }}>{p.name}</td><td>{p.qty}</td><td>{fmt(p.revenue)}</td></tr>
              ))}
              {topProducts.length === 0 && <tr><td colSpan={3} style={{ textAlign: "center", padding: 24, color: "var(--ink-faint)" }}>Sin datos en este rango.</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="bazar-heading" style={{ fontWeight: 800, fontSize: 15, marginBottom: 12 }}>Por método de pago</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {byPayment.map((m) => (
              <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <m.icon size={15} color="var(--ink-soft)" />
                <span style={{ flex: 1, fontSize: 13 }}>{m.label}</span>
                <span style={{ fontWeight: 700, fontSize: 13 }}>{fmt(m.total)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------
   Autenticación (prototipo local — se migrará a Supabase Auth)
--------------------------------------------------------------------- */
function AuthScreen({ users, profiles, onLogin, onRegister }) {
  const [tab, setTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [profileId, setProfileId] = useState(profiles[0]?.id || "");
  const [password2, setPassword2] = useState("");

  function submitLogin() {
    setError("");
    const user = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user || user.passwordHash !== prototypeHash(password)) {
      setError("Correo o contraseña incorrectos.");
      return;
    }
    if (!user.active) {
      setError("Este usuario está inactivo. Contacta al administrador.");
      return;
    }
    onLogin(user.id);
  }

  function submitRegister() {
    setError("");
    if (!name.trim() || !email.trim() || !password) { setError("Completa nombre, correo y contraseña."); return; }
    if (password !== password2) { setError("Las contraseñas no coinciden."); return; }
    if (users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) { setError("Ya existe una cuenta con ese correo."); return; }
    onRegister({
      id: uid(), name: name.trim(), email: email.trim(), phone: phone.trim(),
      profileId: profileId || profiles[0]?.id, active: true,
      passwordHash: prototypeHash(password), createdAt: new Date().toISOString(),
    });
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--primary-light)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Store size={20} color="var(--primary)" />
          </div>
          <div>
            <div className="bazar-heading" style={{ fontWeight: 800, fontSize: 17 }}>Bazar Central</div>
            <div style={{ fontSize: 12, color: "var(--ink-faint)" }}>Sistema de punto de venta</div>
          </div>
        </div>

        <div className="auth-tabs">
          <button className={`auth-tab${tab === "login" ? " active" : ""}`} onClick={() => { setTab("login"); setError(""); }}>Iniciar sesión</button>
          <button className={`auth-tab${tab === "register" ? " active" : ""}`} onClick={() => { setTab("register"); setError(""); }}>Crear cuenta</button>
        </div>

        {tab === "login" ? (
          <div>
            <label className="field-label">Correo electrónico</label>
            <input className="input" style={{ marginBottom: 10 }} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tucorreo@ejemplo.com" />
            <label className="field-label">Contraseña</label>
            <input className="input" style={{ marginBottom: 6 }} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" onKeyDown={(e) => e.key === "Enter" && submitLogin()} />
            <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginBottom: 14 }}>Prototipo: admin@bazar.pe / admin123</div>
            {error && <div style={{ fontSize: 12.5, color: "var(--danger)", marginBottom: 12 }}>{error}</div>}
            <button className="btn btn-primary" style={{ width: "100%" }} onClick={submitLogin}><Lock size={15} /> Ingresar</button>
          </div>
        ) : (
          <div>
            <label className="field-label">Nombre completo</label>
            <input className="input" style={{ marginBottom: 10 }} value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" />
            <label className="field-label">Correo electrónico</label>
            <input className="input" style={{ marginBottom: 10 }} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tucorreo@ejemplo.com" />
            <label className="field-label">Teléfono</label>
            <input className="input" style={{ marginBottom: 10 }} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Opcional" />
            <label className="field-label">Perfil</label>
            <select className="input" style={{ marginBottom: 10 }} value={profileId} onChange={(e) => setProfileId(e.target.value)}>
              {profiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 6 }}>
              <div>
                <label className="field-label">Contraseña</label>
                <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
              </div>
              <div>
                <label className="field-label">Confirmar</label>
                <input className="input" type="password" value={password2} onChange={(e) => setPassword2(e.target.value)} placeholder="••••••••" />
              </div>
            </div>
            {error && <div style={{ fontSize: 12.5, color: "var(--danger)", margin: "8px 0 4px 0" }}>{error}</div>}
            <button className="btn btn-primary" style={{ width: "100%", marginTop: 8 }} onClick={submitRegister}><UserPlus size={15} /> Crear cuenta</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------
   Mantenimiento: usuarios y perfiles
--------------------------------------------------------------------- */
function emptyUser(profiles) {
  return { id: null, name: "", email: "", phone: "", profileId: profiles[0]?.id || "", active: true, password: "" };
}

function UserForm({ initial, profiles, onCancel, onSave }) {
  const [form, setForm] = useState(initial);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  function submit() {
    if (!form.name.trim() || !form.email.trim()) return;
    onSave({
      id: form.id || uid(),
      name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(),
      profileId: form.profileId, active: form.active !== undefined ? form.active : true,
      passwordHash: form.password ? prototypeHash(form.password) : form.passwordHash,
      createdAt: form.createdAt || new Date().toISOString(),
    });
  }

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <div className="bazar-heading" style={{ fontWeight: 800, fontSize: 16, marginBottom: 16 }}>{form.id ? "Editar usuario" : "Nuevo usuario"}</div>
        <label className="field-label">Nombre completo</label>
        <input className="input" style={{ marginBottom: 10 }} value={form.name} onChange={set("name")} placeholder="Nombre y apellido" />
        <label className="field-label">Correo electrónico</label>
        <input className="input" style={{ marginBottom: 10 }} type="email" value={form.email} onChange={set("email")} placeholder="correo@ejemplo.com" />
        <label className="field-label">Teléfono</label>
        <input className="input" style={{ marginBottom: 10 }} value={form.phone} onChange={set("phone")} placeholder="Opcional" />
        <label className="field-label">Perfil</label>
        <select className="input" style={{ marginBottom: 10 }} value={form.profileId} onChange={set("profileId")}>
          {profiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <label className="field-label">{form.id ? "Nueva contraseña (opcional)" : "Contraseña"}</label>
        <input className="input" style={{ marginBottom: 10 }} type="password" value={form.password || ""} onChange={set("password")} placeholder={form.id ? "Dejar en blanco para no cambiar" : "••••••••"} />
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, marginBottom: 18, cursor: "pointer" }}>
          <input type="checkbox" checked={!!form.active} onChange={set("active")} /> Usuario activo
        </label>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={onCancel}>Cancelar</button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={submit}>Guardar</button>
        </div>
      </div>
    </div>
  );
}

function emptyProfile() { return { id: null, name: "", description: "", permissions: [] }; }

function ProfileForm({ initial, onCancel, onSave }) {
  const [form, setForm] = useState(initial);
  function toggleModule(id) {
    setForm((f) => ({ ...f, permissions: f.permissions.includes(id) ? f.permissions.filter((x) => x !== id) : [...f.permissions, id] }));
  }
  function submit() {
    if (!form.name.trim()) return;
    onSave({ ...form, id: form.id || uid(), name: form.name.trim() });
  }
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <div className="bazar-heading" style={{ fontWeight: 800, fontSize: 16, marginBottom: 16 }}>{form.id ? "Editar perfil" : "Nuevo perfil"}</div>
        <label className="field-label">Nombre del perfil</label>
        <input className="input" style={{ marginBottom: 10 }} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej. Cajero" />
        <label className="field-label">Descripción</label>
        <textarea className="input" style={{ marginBottom: 14, minHeight: 56, resize: "vertical", fontFamily: "inherit" }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="¿Qué hace este perfil?" />
        <label className="field-label">Módulos habilitados</label>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
          {MODULES.map((m) => (
            <label key={m.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, cursor: "pointer" }}>
              <input type="checkbox" checked={form.permissions.includes(m.id)} onChange={() => toggleModule(m.id)} /> {m.label}
            </label>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={onCancel}>Cancelar</button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={submit}>Guardar</button>
        </div>
      </div>
    </div>
  );
}

function Mantenimiento({ users, profiles, currentUserId, onSaveUser, onDeleteUser, onSaveProfile, onDeleteProfile }) {
  const [tab, setTab] = useState("usuarios");
  const [editingUser, setEditingUser] = useState(null);
  const [editingProfile, setEditingProfile] = useState(null);

  return (
    <div>
      <div className="tab-row">
        <button className={`tab-btn${tab === "usuarios" ? " active" : ""}`} onClick={() => setTab("usuarios")}>Usuarios</button>
        <button className={`tab-btn${tab === "perfiles" ? " active" : ""}`} onClick={() => setTab("perfiles")}>Perfiles</button>
      </div>

      {tab === "usuarios" ? (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
            <button className="btn btn-primary" onClick={() => setEditingUser(emptyUser(profiles))}><UserPlus size={16} /> Nuevo usuario</button>
          </div>
          <div className="card" style={{ padding: 0, overflowX: "auto" }}>
            <table className="data-table">
              <thead><tr><th>Usuario</th><th>Correo</th><th>Perfil</th><th>Estado</th><th></th></tr></thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 700 }}>{u.name}{u.id === currentUserId && <span className="badge badge-accent" style={{ marginLeft: 8 }}>Tú</span>}</td>
                    <td style={{ color: "var(--ink-soft)" }}>{u.email}</td>
                    <td><span className="badge badge-ok">{profiles.find((p) => p.id === u.profileId)?.name || "—"}</span></td>
                    <td><span className={`badge ${u.active ? "badge-ok" : "badge-low"}`}>{u.active ? "Activo" : "Inactivo"}</span></td>
                    <td>
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                        <button className="btn btn-ghost" style={{ padding: 6 }} onClick={() => setEditingUser(u)}><Pencil size={14} /></button>
                        <button className="btn btn-ghost" style={{ padding: 6, color: "var(--danger)" }} disabled={u.id === currentUserId} onClick={() => onDeleteUser(u.id)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
            <button className="btn btn-primary" onClick={() => setEditingProfile(emptyProfile())}><Plus size={16} /> Nuevo perfil</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 14 }}>
            {profiles.map((p) => (
              <div key={p.id} className="card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div className="bazar-heading" style={{ fontWeight: 800, fontSize: 15, display: "flex", alignItems: "center", gap: 6 }}><ShieldCheck size={15} color="var(--primary)" /> {p.name}</div>
                    <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 4 }}>{p.description || "Sin descripción."}</div>
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button className="btn btn-ghost" style={{ padding: 5 }} onClick={() => setEditingProfile(p)}><Pencil size={13} /></button>
                    <button className="btn btn-ghost" style={{ padding: 5, color: "var(--danger)" }} onClick={() => onDeleteProfile(p.id)}><Trash2 size={13} /></button>
                  </div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
                  {p.permissions.map((mid) => (
                    <span key={mid} className="badge badge-accent">{MODULES.find((m) => m.id === mid)?.label || mid}</span>
                  ))}
                  {p.permissions.length === 0 && <span style={{ fontSize: 12, color: "var(--ink-faint)" }}>Sin módulos asignados</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {editingUser && <UserForm initial={editingUser} profiles={profiles} onCancel={() => setEditingUser(null)} onSave={(u) => { onSaveUser(u); setEditingUser(null); }} />}
      {editingProfile && <ProfileForm initial={editingProfile} onCancel={() => setEditingProfile(null)} onSave={(p) => { onSaveProfile(p); setEditingProfile(null); }} />}
    </div>
  );
}

/* ---------------------------------------------------------------------
   App shell
--------------------------------------------------------------------- */
const NAV = [
  { id: "dashboard", label: "Panel", icon: LayoutDashboard },
  { id: "pos", label: "Vender", icon: ShoppingCart },
  { id: "productos", label: "Productos", icon: Package },
  { id: "ingresos", label: "Ingresos", icon: PackagePlus },
  { id: "inventario", label: "Inventario", icon: BarChart3 },
  { id: "clientes", label: "Clientes", icon: Users },
  { id: "reportes", label: "Reportes", icon: Receipt },
  { id: "mantenimiento", label: "Mantenimiento", icon: UserCog },
];

export default function BazarApp() {
  const [page, setPage] = useState("dashboard");
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const [p, c, s, r, pr, us, sess] = await Promise.all([
        loadKey("bazar:products", null),
        loadKey("bazar:customers", []),
        loadKey("bazar:sales", []),
        loadKey("bazar:receipts", []),
        loadKey("bazar:profiles", null),
        loadKey("bazar:users", null),
        loadKey("bazar:session", null),
      ]);
      setProducts(p === null ? SEED_PRODUCTS : p);
      if (p === null) saveKey("bazar:products", SEED_PRODUCTS);
      setCustomers(c);
      setSales(s);
      setReceipts(r);
      const finalProfiles = pr === null ? DEFAULT_PROFILES : pr;
      const finalUsers = us === null ? SEED_USERS : us;
      setProfiles(finalProfiles);
      if (pr === null) saveKey("bazar:profiles", DEFAULT_PROFILES);
      setUsers(finalUsers);
      if (us === null) saveKey("bazar:users", SEED_USERS);
      if (sess && sess.userId && finalUsers.some((u) => u.id === sess.userId)) {
        setCurrentUserId(sess.userId);
      }
      setReady(true);
    })();
  }, []);

  function upsertProduct(p) {
    setProducts((prev) => {
      const exists = prev.some((x) => x.id === p.id);
      const next = exists ? prev.map((x) => (x.id === p.id ? p : x)) : [...prev, p];
      saveKey("bazar:products", next);
      return next;
    });
  }
  function deleteProduct(id) {
    setProducts((prev) => {
      const next = prev.filter((x) => x.id !== id);
      saveKey("bazar:products", next);
      return next;
    });
  }
  function adjustStock(id, delta) {
    setProducts((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, stock: Math.max(0, p.stock + delta) } : p));
      saveKey("bazar:products", next);
      return next;
    });
  }
  function upsertCustomer(c) {
    setCustomers((prev) => {
      const exists = prev.some((x) => x.id === c.id);
      const next = exists ? prev.map((x) => (x.id === c.id ? c : x)) : [...prev, c];
      saveKey("bazar:customers", next);
      return next;
    });
  }
  function deleteCustomer(id) {
    setCustomers((prev) => {
      const next = prev.filter((x) => x.id !== id);
      saveKey("bazar:customers", next);
      return next;
    });
  }
  function registerReceipt(receipt) {
    setReceipts((prev) => {
      const next = [...prev, receipt];
      saveKey("bazar:receipts", next);
      return next;
    });
    setProducts((prev) => {
      const next = prev.map((p) => {
        const line = receipt.items.find((it) => it.productId === p.id);
        if (!line) return p;
        return { ...p, stock: p.stock + line.qty, costPrice: line.costPrice || p.costPrice };
      });
      saveKey("bazar:products", next);
      return next;
    });
  }
  function registerSale(sale) {
    setSales((prev) => {
      const next = [...prev, sale];
      saveKey("bazar:sales", next);
      return next;
    });
    setProducts((prev) => {
      const next = prev.map((p) => {
        const line = sale.items.find((it) => it.productId === p.id);
        return line ? { ...p, stock: Math.max(0, p.stock - line.qty) } : p;
      });
      saveKey("bazar:products", next);
      return next;
    });
  }

  function upsertUser(u) {
    setUsers((prev) => {
      const exists = prev.some((x) => x.id === u.id);
      const next = exists ? prev.map((x) => (x.id === u.id ? u : x)) : [...prev, u];
      saveKey("bazar:users", next);
      return next;
    });
  }
  function deleteUser(id) {
    if (id === currentUserId) return;
    setUsers((prev) => {
      const next = prev.filter((x) => x.id !== id);
      saveKey("bazar:users", next);
      return next;
    });
  }
  function upsertProfile(p) {
    setProfiles((prev) => {
      const exists = prev.some((x) => x.id === p.id);
      const next = exists ? prev.map((x) => (x.id === p.id ? p : x)) : [...prev, p];
      saveKey("bazar:profiles", next);
      return next;
    });
  }
  function deleteProfile(id) {
    setProfiles((prev) => {
      const next = prev.filter((x) => x.id !== id);
      saveKey("bazar:profiles", next);
      return next;
    });
  }

  function login(userId) {
    setCurrentUserId(userId);
    setPage("dashboard");
    saveKey("bazar:session", { userId });
  }
  function registerAndLogin(newUser) {
    upsertUser(newUser);
    login(newUser.id);
  }
  function logout() {
    setCurrentUserId(null);
    saveKey("bazar:session", null);
  }

  if (!ready) {
    return (
      <div className="bazar-root" style={{ alignItems: "center", justifyContent: "center" }}>
        <style>{TOKENS}</style>
        <span style={{ color: "var(--ink-faint)", fontSize: 14 }}>Cargando…</span>
      </div>
    );
  }

  if (!currentUserId) {
    return (
      <>
        <style>{TOKENS}</style>
        <AuthScreen users={users} profiles={profiles} onLogin={login} onRegister={registerAndLogin} />
      </>
    );
  }

  const currentUser = users.find((u) => u.id === currentUserId);
  const currentProfile = profiles.find((p) => p.id === currentUser?.profileId);
  const allowed = currentProfile?.permissions || [];
  const visibleNav = NAV.filter((n) => allowed.includes(n.id));
  const activePage = visibleNav.some((n) => n.id === page) ? page : (visibleNav[0]?.id || "dashboard");

  return (
    <div className="bazar-root">
      <style>{TOKENS}</style>

      <nav className="bazar-nav">
        <div className="bazar-nav-brand">Bazar Central</div>
        {visibleNav.map((item) => (
          <button key={item.id} className={`bazar-nav-item${activePage === item.id ? " active" : ""}`} onClick={() => setPage(item.id)}>
            <item.icon size={16} /> {item.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.14)", marginTop: 8, paddingTop: 10 }}>
          <div style={{ padding: "0 12px 8px 12px", fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
            <div style={{ fontWeight: 700, color: "#fff" }}>{currentUser?.name}</div>
            <div>{currentProfile?.name}</div>
          </div>
          <button className="bazar-nav-item" onClick={logout}><LogOut size={16} /> Cerrar sesión</button>
        </div>
      </nav>

      <div className="bazar-main">
        <div className="bazar-topbar">
          <div>
            <div className="bazar-heading" style={{ fontWeight: 800, fontSize: 18 }}>
              {NAV.find((n) => n.id === activePage)?.label}
            </div>
            <div style={{ fontSize: 12.5, color: "var(--ink-faint)" }}>
              {new Date().toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" })}
            </div>
          </div>
          <button className="btn btn-ghost" style={{ fontSize: 12.5 }} onClick={logout}>
            <LogOut size={15} /> Salir
          </button>
        </div>

        <div className="bazar-content">
          {activePage === "dashboard" && <Dashboard products={products} sales={sales} />}
          {activePage === "pos" && <POS products={products} customers={customers} onSale={registerSale} />}
          {activePage === "productos" && <Productos products={products} onSave={upsertProduct} onDelete={deleteProduct} />}
          {activePage === "ingresos" && <Ingresos products={products} receipts={receipts} onReceive={registerReceipt} />}
          {activePage === "inventario" && <Inventario products={products} onAdjust={adjustStock} />}
          {activePage === "clientes" && <Clientes customers={customers} sales={sales} onSave={upsertCustomer} onDelete={deleteCustomer} />}
          {activePage === "reportes" && <Reportes sales={sales} products={products} />}
          {activePage === "mantenimiento" && (
            <Mantenimiento
              users={users} profiles={profiles} currentUserId={currentUserId}
              onSaveUser={upsertUser} onDeleteUser={deleteUser}
              onSaveProfile={upsertProfile} onDeleteProfile={deleteProfile}
            />
          )}
        </div>
      </div>

      <div className="bottom-nav">
        {visibleNav.map((item) => (
          <button key={item.id} className={activePage === item.id ? "active" : ""} onClick={() => setPage(item.id)}>
            <item.icon size={18} />
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
