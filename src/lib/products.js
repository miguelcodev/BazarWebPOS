export const UNIT_OPTIONS = [
  { id: 'unidad', label: 'Unidad', short: 'und' },
  { id: 'par', label: 'Par', short: 'par' },
  { id: 'pack', label: 'Pack', short: 'pack' },
  { id: 'caja', label: 'Caja', short: 'caja' },
  { id: 'docena', label: 'Docena', short: 'doc' },
  { id: 'litro', label: 'Litro', short: 'L' },
  { id: 'kilogramo', label: 'Kilogramo', short: 'kg' },
  { id: 'metro', label: 'Metro', short: 'm' },
  { id: 'galon', label: 'Galón', short: 'gal' },
]

export function unitShort(product) {
  return UNIT_OPTIONS.find((unit) => unit.id === product?.unit)?.short || 'und'
}

export function unitLabel(unitId) {
  return UNIT_OPTIONS.find((unit) => unit.id === unitId)?.label || 'Unidad'
}

export function fromProductRow(row) {
  return {
    id: row.id,
    name: row.name,
    barcode: row.barcode || '',
    category: row.category || '',
    unit: row.unit || 'unidad',
    weight: row.weight ?? '',
    weightUnit: row.weight_unit || 'g',
    description: row.description || '',
    costPrice: row.cost_price,
    salePrice: row.sale_price,
    stock: row.stock,
    minStock: row.min_stock,
    imageUrl: row.image_url || '',
  }
}
