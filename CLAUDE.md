# Bazar Central — POS para bazar/minimarket

## Qué es
App de punto de venta para un bazar minorista en Perú: ventas, inventario, ingresos de mercadería, clientes y reportes. Multi-usuario con perfiles y permisos.

## Stack
- React + Vite
- Supabase (Postgres + Auth + Storage)
- lucide-react, recharts
- CSS propio con variables (ver src/styles/tokens.css)

## Convenciones
- Moneda: soles peruanos, formatear siempre como "S/ 12.50"
- Un módulo de negocio = una carpeta en src/features/<modulo>/
- Los formularios son modales
- Los precios se almacenan como numeric(10,2)
- El cliente genérico no es una fila en la tabla customers: customer_id = null en sales

## Modelo de datos
Esta app debe respetar el esquema de Supabase definido en supabase-schema.md.

## Módulos y permisos
Los ids de módulo deben coincidir entre el frontend y la base de datos:
- dashboard
- pos
- productos
- ingresos
- proveedores
- inventario
- clientes
- reportes
- mantenimiento

## Qué NO hacer
- No guardar contraseñas ni hashes propios
- No embeber los ítems de una venta o ingreso como JSON
- No hardcodear la anon key ni la URL de Supabase
