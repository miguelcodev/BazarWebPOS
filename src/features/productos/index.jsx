import { useEffect, useMemo, useState } from 'react'
import { ImageUp, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { UNIT_OPTIONS, unitLabel, unitShort, fromProductRow } from '../../lib/products'
import { isImageFileValid, removeProductImage, uploadProductImage } from '../../lib/imageUpload'
import { Thumb } from '../../components/Thumb'

const WEIGHT_UNITS = ['g', 'kg', 'ml', 'L']

function fmt(value) {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(Number(value) || 0)
}

function emptyProduct() {
  return {
    id: null,
    name: '',
    barcode: '',
    category: '',
    unit: 'unidad',
    weight: '',
    weightUnit: 'g',
    description: '',
    costPrice: '',
    salePrice: '',
    stock: '',
    minStock: '',
    imageUrl: '',
  }
}

function toRow(product) {
  return {
    name: product.name,
    barcode: product.barcode?.trim() ? product.barcode.trim() : null,
    category: product.category,
    unit: product.unit || 'unidad',
    weight: product.weight === '' ? null : Number(product.weight),
    weight_unit: product.weightUnit || 'g',
    description: product.description,
    cost_price: Number(product.costPrice) || 0,
    sale_price: Number(product.salePrice) || 0,
    stock: Number(product.stock) || 0,
    min_stock: Number(product.minStock) || 0,
    image_url: product.imageUrl,
  }
}

function ProductForm({ initial, onCancel, onSave, saving, categoryOptions }) {
  const [form, setForm] = useState(initial)
  const isKnownCategory = categoryOptions.includes(initial.category)
  const [categoryChoice, setCategoryChoice] = useState(isKnownCategory ? initial.category : initial.category ? 'otra' : '')
  const [customCategory, setCustomCategory] = useState(isKnownCategory ? '' : initial.category)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [removeImage, setRemoveImage] = useState(false)
  const [imageError, setImageError] = useState('')

  useEffect(() => () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview)
  }, [imagePreview])

  const setField = (key) => (event) => setForm({ ...form, [key]: event.target.value })
  const margin = form.salePrice && form.costPrice ? (((form.salePrice - form.costPrice) / form.salePrice) * 100).toFixed(0) : null

  function handleImageSelect(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const validationError = isImageFileValid(file)
    if (validationError) {
      setImageError(validationError)
      return
    }

    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImageError('')
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setRemoveImage(false)
  }

  function handleClearImage() {
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImageFile(null)
    setImagePreview('')
    setRemoveImage(true)
    setImageError('')
  }

  function handleSave() {
    if (!form.name || form.salePrice === '') return

    const finalCategory = categoryChoice === 'otra' ? customCategory.trim() : categoryChoice

    onSave({
      ...form,
      category: finalCategory,
      unit: form.unit || 'unidad',
      weightUnit: form.weightUnit || 'g',
      imageUrl: removeImage ? '' : form.imageUrl,
      imageFile,
      removeImage,
    })
  }

  const previewUrl = imagePreview || (removeImage ? '' : form.imageUrl)

  return (
    <div onClick={onCancel} style={{ position: 'fixed', inset: 0, background: 'rgba(23,32,51,0.4)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div onClick={(event) => event.stopPropagation()} style={{ width: '100%', maxWidth: 720, background: '#fff', borderRadius: 18, padding: 20, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontWeight: 800, fontSize: 16 }}>{form.id ? 'Editar producto' : 'Nuevo producto'}</div>
          <button type="button" onClick={onCancel} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: 14, marginBottom: 12, alignItems: 'flex-start' }}>
          <Thumb url={previewUrl} name={form.name} width={80} height={80} radius={14} />
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Foto del producto</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid #dfe7f6', background: '#fff', borderRadius: 10, padding: '9px 12px', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                <ImageUp size={15} /> {previewUrl ? 'Cambiar foto' : 'Subir foto'}
                <input type="file" accept="image/*" onChange={handleImageSelect} style={{ display: 'none' }} />
              </label>
              {previewUrl && (
                <button type="button" onClick={handleClearImage} style={{ border: '1px solid #f5d2d7', background: '#fff', color: '#d9534f', borderRadius: 10, padding: '9px 12px', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                  Quitar foto
                </button>
              )}
            </div>
            <div style={{ color: '#5f6b7a', fontSize: 11.5, marginTop: 6 }}>Se ajusta automáticamente para verse bien en Productos y en el POS.</div>
            {imageError && <div style={{ color: '#e14d5b', fontSize: 12, marginTop: 4 }}>{imageError}</div>}
          </div>
        </div>

        <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Nombre</label>
        <input value={form.name} onChange={setField('name')} placeholder="Ej. Arroz Extra 1kg" style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #dfe7f6', marginBottom: 10 }} />

        <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Descripción</label>
        <textarea value={form.description} onChange={setField('description')} placeholder="Detalles del producto…" style={{ width: '100%', minHeight: 68, resize: 'vertical', padding: '10px 12px', borderRadius: 10, border: '1px solid #dfe7f6', marginBottom: 10 }} />

        <div style={{ marginBottom: 10 }}>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Categoría</label>
          <select value={categoryChoice} onChange={(event) => setCategoryChoice(event.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #dfe7f6' }}>
            <option value="">Selecciona una categoría</option>
            {categoryOptions.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
            <option value="otra">Otra…</option>
          </select>
          {categoryChoice === 'otra' && (
            <input value={customCategory} onChange={(event) => setCustomCategory(event.target.value)} placeholder="Especifica la categoría" style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #dfe7f6', marginTop: 8 }} />
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Código de barras</label>
            <input value={form.barcode} onChange={setField('barcode')} placeholder="Opcional" style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #dfe7f6' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Unidad de venta</label>
            <select value={form.unit} onChange={setField('unit')} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #dfe7f6' }}>
              {UNIT_OPTIONS.map((unit) => (
                <option key={unit.id} value={unit.id}>{unit.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 10 }}>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Peso / contenido</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 10 }}>
            <input type="number" value={form.weight} onChange={setField('weight')} placeholder="Ej. 500" style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #dfe7f6' }} />
            <select value={form.weightUnit} onChange={setField('weightUnit')} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #dfe7f6' }}>
              {WEIGHT_UNITS.map((unit) => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Precio de compra</label>
            <input type="number" value={form.costPrice} onChange={setField('costPrice')} placeholder="0.00" style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #dfe7f6' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Precio de venta</label>
            <input type="number" value={form.salePrice} onChange={setField('salePrice')} placeholder="0.00" style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #dfe7f6' }} />
          </div>
        </div>

        {margin !== null && (
          <div style={{ fontSize: 12, color: '#5f6b7a', marginBottom: 10 }}>
            Margen aproximado: <strong style={{ color: '#2f6fed' }}>{margin}%</strong>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Stock actual ({unitLabel(form.unit)})</label>
            <input type="number" value={form.stock} onChange={setField('stock')} placeholder="0" style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #dfe7f6' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Stock mínimo</label>
            <input type="number" value={form.minStock} onChange={setField('minStock')} placeholder="0" style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #dfe7f6' }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" onClick={onCancel} style={{ flex: 1, border: '1px solid #dfe7f6', background: '#fff', borderRadius: 10, padding: '10px 12px', cursor: 'pointer', fontWeight: 700 }}>
            Cancelar
          </button>
          <button type="button" onClick={handleSave} disabled={saving} style={{ flex: 1, border: 'none', background: '#2f6fed', color: '#fff', borderRadius: 10, padding: '10px 12px', cursor: saving ? 'default' : 'pointer', fontWeight: 700, opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ProductosModule() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true

    Promise.all([
      supabase.from('products').select('*').order('name'),
      supabase.from('categories').select('name').order('name'),
    ]).then(([productsRes, categoriesRes]) => {
      if (!active) return
      if (productsRes.error) setError(productsRes.error.message)
      else setProducts((productsRes.data || []).map(fromProductRow))
      if (categoriesRes.error) setError((current) => current || categoriesRes.error.message)
      else setCategories((categoriesRes.data || []).map((row) => row.name))
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [])

  const filtered = useMemo(
    () =>
      products.filter(
        (product) =>
          product.name.toLowerCase().includes(query.toLowerCase()) ||
          product.barcode.includes(query),
      ),
    [products, query],
  )

  async function handleSave({ imageFile, removeImage, ...product }) {
    setSaving(true)
    setError('')

    const row = toRow(product)
    let savedRow

    if (product.id) {
      const { data, error: updateError } = await supabase
        .from('products')
        .update({ ...row, updated_at: new Date().toISOString() })
        .eq('id', product.id)
        .select()
        .single()

      if (updateError) {
        setError(updateError.message)
        setSaving(false)
        return
      }
      savedRow = data
    } else {
      const { data, error: insertError } = await supabase.rpc('register_product', { payload: row })

      if (insertError) {
        setError(insertError.message)
        setSaving(false)
        return
      }
      savedRow = data
    }

    if (imageFile) {
      try {
        const publicUrl = await uploadProductImage(imageFile, savedRow.id)
        const { data: updated, error: imageError } = await supabase
          .from('products')
          .update({ image_url: publicUrl })
          .eq('id', savedRow.id)
          .select()
          .single()

        if (imageError) setError(imageError.message)
        else savedRow = updated
      } catch (uploadError) {
        setError(uploadError.message || 'No se pudo subir la imagen.')
      }
    } else if (removeImage && savedRow.image_url) {
      await removeProductImage(savedRow.id)
    }

    setProducts((current) => {
      const mapped = fromProductRow(savedRow)
      const exists = current.some((item) => item.id === mapped.id)
      return exists ? current.map((item) => (item.id === mapped.id ? mapped : item)) : [mapped, ...current]
    })
    setSaving(false)
    setEditing(null)
  }

  async function handleDelete(productId) {
    setError('')
    const { error: deleteError } = await supabase.from('products').delete().eq('id', productId)
    if (deleteError) {
      setError(deleteError.message)
      return
    }
    await removeProductImage(productId)
    setProducts((current) => current.filter((product) => product.id !== productId))
  }

  return (
    <section style={{ display: 'grid', gap: 18 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#5f6b7a' }} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar producto o código…" style={{ width: '100%', padding: '10px 12px 10px 34px', borderRadius: 10, border: '1px solid #dfe7f6' }} />
        </div>

        <button type="button" onClick={() => setEditing(emptyProduct())} style={{ border: 'none', background: '#2f6fed', color: '#fff', borderRadius: 10, padding: '10px 14px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
          <Plus size={16} /> Nuevo producto
        </button>
      </div>

      {error && <div style={{ color: '#e14d5b', fontSize: 13 }}>{error}</div>}

      <div style={{ background: '#fff', border: '1px solid #e5eaf3', borderRadius: 18, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f7f9fd' }}>
            <tr>
              <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: 12, color: '#5f6b7a' }}></th>
              <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: 12, color: '#5f6b7a' }}>Producto</th>
              <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: 12, color: '#5f6b7a' }}>Categoría</th>
              <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: 12, color: '#5f6b7a' }}>Compra</th>
              <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: 12, color: '#5f6b7a' }}>Venta</th>
              <th style={{ textAlign: 'left', padding: '14px 16px', fontSize: 12, color: '#5f6b7a' }}>Stock</th>
              <th style={{ textAlign: 'right', padding: '14px 16px', fontSize: 12, color: '#5f6b7a' }}></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 30, color: '#5f6b7a' }}>Cargando productos…</td>
              </tr>
            )}

            {!loading && filtered.map((product) => (
              <tr key={product.id} style={{ borderTop: '1px solid #edf1f7' }}>
                <td style={{ padding: '14px 16px' }}>
                  <Thumb url={product.imageUrl} name={product.name} width={34} height={34} radius={10} />
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ fontWeight: 700 }}>{product.name}</div>
                  <div style={{ color: '#5f6b7a', fontSize: 11.5 }}>{product.barcode || 'sin código'}{product.weight ? ` · ${product.weight}${product.weightUnit}` : ''}</div>
                </td>
                <td style={{ padding: '14px 16px', color: '#5f6b7a' }}>{product.category || '—'}</td>
                <td style={{ padding: '14px 16px' }}>{fmt(product.costPrice)}</td>
                <td style={{ padding: '14px 16px', fontWeight: 700 }}>{fmt(product.salePrice)}</td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ display: 'inline-block', background: product.stock <= product.minStock ? '#fff1f2' : '#edf7f1', color: product.stock <= product.minStock ? '#c93d4e' : '#1ea97c', borderRadius: 999, padding: '5px 9px', fontSize: 11, fontWeight: 700 }}>
                    {product.stock} {unitShort(product)}
                  </span>
                </td>
                <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                    <button type="button" onClick={() => setEditing(product)} style={{ border: '1px solid #dfe7f6', background: '#fff', borderRadius: 8, padding: '6px', cursor: 'pointer' }}>
                      <Pencil size={14} />
                    </button>
                    <button type="button" onClick={() => handleDelete(product.id)} style={{ border: '1px solid #f5d2d7', background: '#fff', borderRadius: 8, padding: '6px', color: '#d9534f', cursor: 'pointer' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 30, color: '#5f6b7a' }}>No hay productos.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <ProductForm
          initial={editing}
          saving={saving}
          categoryOptions={categories}
          onCancel={() => setEditing(null)}
          onSave={handleSave}
        />
      )}
    </section>
  )
}
