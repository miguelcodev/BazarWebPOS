# Bazar Central — Guía para iniciar el proyecto en VS Code con Claude Code

## 1. Revisión del prototipo actual

Lo construido hasta ahora es un **prototipo funcional en un solo archivo React** (`bazar-pos.jsx`), pensado para validar el flujo completo del negocio antes de invertir en la app real. Módulos cubiertos:

- **Panel** — ventas del día/mes, gráfico de 7 días, top de productos, alertas de stock bajo.
- **Vender (POS)** — búsqueda por nombre/código de barras, carrito, cliente genérico o registrado, 4 métodos de pago, cálculo de vuelto.
- **Productos** — CRUD con categoría (select), unidad de venta, peso, descripción, imagen referencial.
- **Ingresos** — registro de compras a proveedor (boleta/factura/guía) que alimenta stock y costo.
- **Inventario** — vista de stock con ajustes manuales de entrada/salida.
- **Clientes** — CRUD básico con correo, teléfono y documento.
- **Reportes** — ingresos por rango de fechas, productos top, desglose por método de pago.
- **Mantenimiento** — usuarios, perfiles y permisos por módulo.
- **Login/registro** — pantalla de acceso, sesión persistida localmente.

### Decisiones tomadas por las limitaciones del entorno de prototipado (a revisar al migrar)

| Punto | Estado actual | Por qué cambia al migrar |
|---|---|---|
| Estilos | CSS propio inyectado con variables (`--primary`, etc.), sin compilador Tailwind | Se puede mantener igual (es CSS válido) o migrarlo a Tailwind real — ambas opciones sirven |
| Datos | `window.storage` (clave-valor local del artifact) | Debe pasar a Supabase — ya documentado en `supabase-schema.md` |
| Contraseñas | Hash simple (`btoa`) solo para simular el login | **Inseguro para producción.** Se reemplaza por Supabase Auth completo |
| Estructura | Todo en un único archivo de ~1900 líneas | Se divide en módulos/carpetas al iniciar el proyecto real |
| Ventas/ingresos | Ítems guardados como arreglo embebido | Se normalizan en tablas relacionadas (`sale_items`, `receipt_items`) |

Este documento cubre el **primer punto de la migración**: pasar de "artifact de un archivo" a un proyecto real en VS Code, trabajado con Claude Code.

---

## 2. Prerrequisitos

- **Node.js 18 o superior** — verifica con `node -v`. Si no lo tienes, instálalo desde [nodejs.org](https://nodejs.org/en/download).
- **VS Code** instalado.
- **Git** instalado (`git --version`).
- **Cuenta de Supabase** con el proyecto ya creado (para cuando llegues al paso 6).
- **Claude Code** instalado:

  ```bash
  # macOS / Linux / WSL
  curl -fsSL https://claude.ai/install.sh | bash
  ```
  ```powershell
  # Windows PowerShell
  irm https://claude.ai/install.ps1 | iex
  ```

  Verifica la instalación:
  ```bash
  claude --version
  ```

---

## 3. Crear el proyecto

```bash
# 1. Crear el proyecto con Vite + React
npm create vite@latest bazar-central -- --template react

cd bazar-central

# 2. Instalar dependencias base
npm install

# 3. Instalar las librerías que usa la app
npm install lucide-react recharts @supabase/supabase-js
```

> Si más adelante quieres Tailwind real (opcional, el prototipo no lo requiere porque usa CSS propio):
> ```bash
> npm install -D tailwindcss postcss autoprefixer
> npx tailwindcss init -p
> ```

Abre el proyecto en VS Code:

```bash
code .
```

---

## 4. Estructura de carpetas recomendada

```
bazar-central/
├─ src/
│  ├─ lib/
│  │  └─ supabase.js          # cliente único de Supabase
│  ├─ styles/
│  │  └─ tokens.css           # variables de color/tipografía (del TOKENS actual)
│  ├─ components/             # piezas compartidas: Thumb, StatCard, Modal…
│  ├─ features/
│  │  ├─ auth/                # AuthScreen
│  │  ├─ dashboard/           # Dashboard
│  │  ├─ pos/                 # POS
│  │  ├─ productos/           # Productos, ProductForm
│  │  ├─ ingresos/            # Ingresos
│  │  ├─ inventario/          # Inventario, AdjustModal
│  │  ├─ clientes/            # Clientes, CustomerForm
│  │  ├─ reportes/            # Reportes
│  │  └─ mantenimiento/       # Mantenimiento, UserForm, ProfileForm
│  ├─ App.jsx                 # shell: nav, routing entre módulos, sesión
│  └─ main.jsx
├─ .env                       # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (no se sube a git)
├─ .env.example
├─ CLAUDE.md                  # contexto persistente del proyecto para Claude Code
└─ package.json
```

---

## 5. Archivo `CLAUDE.md` — contexto persistente para Claude Code

Claude Code lee este archivo al abrir el proyecto, así no tienes que re-explicar el negocio en cada sesión. Créalo en la raíz con este contenido de partida (ajústalo a medida que el proyecto crezca):

```markdown
# Bazar Central — POS para bazar/minimarket

## Qué es
App de punto de venta para un bazar minorista en Perú: ventas, inventario,
ingresos de mercadería, clientes y reportes. Multi-usuario con perfiles y permisos.

## Stack
- React + Vite
- Supabase (Postgres + Auth + Storage) como backend
- lucide-react (iconos), recharts (gráficos)
- CSS propio con variables (ver src/styles/tokens.css) — NO usamos Tailwind salvo que se indique lo contrario

## Convenciones
- Moneda: soles peruanos, formatear siempre como "S/ 12.50"
- Un módulo de negocio = una carpeta en src/features/<modulo>/
- Los formularios (ProductForm, CustomerForm, UserForm, ProfileForm) son modales
- Los precios son numeric(10,2) en la base de datos; en el frontend, parseFloat antes de guardar
- El "cliente genérico" no es una fila en la tabla customers: customer_id = null en sales

## Modelo de datos
Ver supabase-schema.md en la raíz del repo — es la fuente de verdad del esquema,
las políticas RLS y las funciones RPC (register_sale, register_receipt).

## Módulos y permisos
Los ids de módulo (dashboard, pos, productos, ingresos, inventario, clientes,
reportes, mantenimiento) deben coincidir exactamente entre:
- El array MODULES del frontend
- El array permissions de la tabla profiles en Supabase
- Los nombres usados en las políticas RLS (has_permission('modulo'))

## Qué NO hacer
- No guardar contraseñas ni hashes propios: la autenticación es 100% Supabase Auth
- No embeber los ítems de una venta/ingreso como JSON en una sola fila:
  van en sale_items / receipt_items
- No hardcodear la anon key ni la URL de Supabase: siempre desde variables de entorno
```

Copia también `supabase-schema.md` a la raíz del repo (o a `/docs`) para que Claude Code pueda leerlo como referencia mientras escribe las consultas.

---

## 6. Variables de entorno

Crea `.env` en la raíz (y agrégalo a `.gitignore`):

```
VITE_SUPABASE_URL=https://<tu-proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=<tu-clave-anon-publica>
```

Y un `.env.example` sin valores reales, para que el repo sea clonable por otras personas.

En Supabase, ejecuta el contenido de `supabase-schema.md` (secciones 3 y 4) en el **SQL Editor** antes de conectar el frontend.

---

## 7. Primera sesión con Claude Code

Dentro de la carpeta del proyecto:

```bash
claude
```

Al ser la primera vez, te pedirá iniciar sesión. Con el proyecto ya abierto, un orden de trabajo razonable para las primeras sesiones:

1. **Traer el prototipo al proyecto**
   > "Voy a pegar el contenido de mi prototipo bazar-pos.jsx. Analízalo y divídelo en la estructura de carpetas de CLAUDE.md: un componente por módulo dentro de src/features/, componentes compartidos en src/components/, y deja App.jsx solo como shell de navegación y sesión."

2. **Conectar Supabase**
   > "Crea src/lib/supabase.js usando las variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY. Luego reemplaza las funciones loadKey/saveKey de productos y clientes por consultas reales a Supabase, siguiendo la tabla de equivalencias de la sección 6 de supabase-schema.md."

3. **Migrar autenticación**
   > "Reemplaza AuthScreen para que use supabase.auth.signInWithPassword y supabase.auth.signUp en vez del hash local. El registro debe enviar name, phone y profile_id como metadata para que el trigger handle_new_user cree la fila en app_users."

4. **Migrar ventas e ingresos con las funciones RPC**
   > "Reemplaza registerSale y registerReceipt para que llamen a las funciones RPC register_sale / register_receipt de Supabase en vez de manipular el estado local directamente."

5. **Verificación**
   > "Revisa que ningún módulo siga usando window.storage y que las políticas RLS mencionadas en supabase-schema.md coincidan con los ids de MODULES."

Ir paso a paso (no pedir todo en un solo prompt) da mejores resultados: cada punto es verificable antes de avanzar al siguiente.

---

## 8. Primer arranque

```bash
npm run dev
```

Abre la URL que muestra la terminal (normalmente `http://localhost:5173`). Si el login falla, primero confirma que las variables de entorno están cargadas (`import.meta.env.VITE_SUPABASE_URL` no debe ser `undefined`) y que ejecutaste el esquema SQL completo en Supabase.

---

## 9. Control de versiones

```bash
git init
git add .
git commit -m "Proyecto inicial: prototipo migrado a Vite + estructura modular"
```

Recomendado desde el primer commit: agregar `.env` al `.gitignore` (Vite ya lo incluye por defecto en las plantillas recientes, pero confírmalo) para no subir tus claves de Supabase al repositorio.

---

## 10. Checklist de arranque

- [ ] Node.js 18+ y Claude Code instalados
- [ ] Proyecto Vite creado y dependencias instaladas
- [ ] Estructura de carpetas creada
- [ ] `CLAUDE.md` en la raíz
- [ ] `supabase-schema.md` copiado al repo
- [ ] Esquema SQL ejecutado en Supabase (tablas + RLS + funciones RPC)
- [ ] `.env` configurado y excluido de git
- [ ] Prototipo dividido en módulos con ayuda de Claude Code
- [ ] Auth migrado a Supabase (login/registro reales)
- [ ] Ventas e ingresos usando las funciones RPC
- [ ] Primer `npm run dev` funcionando de punta a punta
