import { supabase } from './supabase'

const MAX_FILE_SIZE = 15 * 1024 * 1024
const MAX_DIMENSION = 800
const JPEG_QUALITY = 0.82

export function isImageFileValid(file) {
  if (!file.type.startsWith('image/')) return 'Selecciona un archivo de imagen.'
  if (file.size > MAX_FILE_SIZE) return 'La imagen es muy pesada (máx. 15MB).'
  return ''
}

async function resizeImage(file) {
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'))
    reader.readAsDataURL(file)
  })

  const image = await new Promise((resolve, reject) => {
    const el = new Image()
    el.onload = () => resolve(el)
    el.onerror = () => reject(new Error('El archivo no es una imagen válida.'))
    el.src = dataUrl
  })

  const scale = Math.min(1, MAX_DIMENSION / Math.max(image.width, image.height))
  const width = Math.round(image.width * scale)
  const height = Math.round(image.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  canvas.getContext('2d').drawImage(image, 0, 0, width, height)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('No se pudo procesar la imagen.'))),
      'image/jpeg',
      JPEG_QUALITY,
    )
  })
}

export async function uploadProductImage(file, productId) {
  const blob = await resizeImage(file)
  const path = `${productId}.jpg`

  const { error } = await supabase.storage.from('product-images').upload(path, blob, {
    upsert: true,
    contentType: 'image/jpeg',
  })
  if (error) throw error

  const { data } = supabase.storage.from('product-images').getPublicUrl(path)
  return `${data.publicUrl}?v=${Date.now()}`
}

export async function removeProductImage(productId) {
  await supabase.storage.from('product-images').remove([`${productId}.jpg`])
}
