'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { useQuery } from '@tanstack/react-query'
import { fetchCategories } from '@/lib/api'
import type { Product } from '@/lib/types'
import { ClipboardList, Tag, Search, Camera } from 'lucide-react'

const CONDITIONS  = ['NEW_WITH_TAGS', 'LIKE_NEW', 'GOOD', 'FAIR'] as const
const RARITIES    = ['COMMON', 'UNCOMMON', 'RARE', 'VINTAGE_RARE'] as const
const GENDERS     = ['MEN', 'WOMEN', 'UNISEX', 'KIDS'] as const
const STYLE_TAGS  = ['Vintage', 'Y2K', 'Boho', 'Streetwear', '90s', 'Cottagecore', 'Minimalist', 'Grunge', 'Indo-Western', 'Ethnic']
const COLORS      = ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Pink', 'Purple', 'Brown', 'Grey', 'Orange', 'Multicolor']

interface MeasurementPair { key: string; value: string }

export interface ProductFormData {
  title: string
  description: string
  sellingPrice: string
  originalPrice: string
  categoryId: string
  city: string
  condition: string
  gender: string
  rarity: string
  brand: string
  size: string
  fabric: string
  era: string
  color: string[]
  style: string[]
  tags: string
  defects: string
  visibleSpots: string
  measurements: MeasurementPair[]
  imageFiles: File[]
  existingImages: string[]
}

function MultiPill({
  options, selected, onToggle, max,
}: { options: string[]; selected: string[]; onToggle: (v: string) => void; max?: number }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active  = selected.includes(opt)
        const atLimit = max !== undefined && selected.length >= max && !active
        return (
          <button
            key={opt}
            type="button"
            disabled={atLimit}
            onClick={() => onToggle(opt)}
            className={`pixel-btn-sm text-xs font-bold transition-colors ${
              active
                ? 'bg-brand-saffron text-white'
                : 'bg-white text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed'
            }`}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}

interface ProductFormProps {
  initial?: Partial<ProductFormData>
  existingProduct?: Product
  onSubmit: (formData: FormData) => void
  loading: boolean
  submitLabel?: string
}

export function ProductForm({ initial, existingProduct, onSubmit, loading, submitLabel = 'Save Product' }: ProductFormProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories })

  const [form, setForm] = useState<ProductFormData>({
    title:          initial?.title          ?? existingProduct?.title          ?? '',
    description:    initial?.description    ?? existingProduct?.description    ?? '',
    sellingPrice:   initial?.sellingPrice   ?? String(existingProduct?.sellingPrice ?? ''),
    originalPrice:  initial?.originalPrice  ?? String(existingProduct?.originalPrice ?? ''),
    categoryId:     initial?.categoryId     ?? existingProduct?.category?.id  ?? '',
    city:           initial?.city           ?? existingProduct?.city           ?? '',
    condition:      initial?.condition      ?? existingProduct?.condition      ?? 'GOOD',
    gender:         initial?.gender         ?? existingProduct?.gender         ?? 'UNISEX',
    rarity:         initial?.rarity         ?? existingProduct?.rarity         ?? 'COMMON',
    brand:          initial?.brand          ?? existingProduct?.brand          ?? '',
    size:           initial?.size           ?? existingProduct?.size           ?? '',
    fabric:         initial?.fabric         ?? existingProduct?.fabric         ?? '',
    era:            initial?.era            ?? existingProduct?.era            ?? '',
    color:          initial?.color          ?? existingProduct?.color          ?? [],
    style:          initial?.style          ?? existingProduct?.style          ?? [],
    tags:           initial?.tags           ?? existingProduct?.tags?.join(', ') ?? '',
    defects:        initial?.defects        ?? existingProduct?.defects        ?? '',
    visibleSpots:   initial?.visibleSpots   ?? existingProduct?.visibleSpots   ?? '',
    measurements:   initial?.measurements   ?? Object.entries(existingProduct?.measurements ?? {}).map(([key, value]) => ({ key, value: String(value) })),
    imageFiles:     [],
    existingImages: initial?.existingImages ?? existingProduct?.images         ?? [],
  })

  const [imagePreviews, setImagePreviews] = useState<string[]>([])

  function setField(field: keyof ProductFormData) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((f) => ({ ...f, [field]: e.target.value }))
    }
  }

  function toggleArray(field: 'color' | 'style', value: string) {
    setForm((f) => {
      const arr = f[field] as string[]
      return { ...f, [field]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value] }
    })
  }

  function addMeasurement() {
    setForm((f) => ({ ...f, measurements: [...f.measurements, { key: '', value: '' }] }))
  }

  function removeMeasurement(i: number) {
    setForm((f) => ({ ...f, measurements: f.measurements.filter((_, idx) => idx !== i) }))
  }

  function updateMeasurement(i: number, field: 'key' | 'value', val: string) {
    setForm((f) => {
      const m = [...f.measurements]
      m[i] = { ...m[i], [field]: val }
      return { ...f, measurements: m }
    })
  }

  function handleFiles(files: FileList | null) {
    if (!files) return
    const remaining = 5 - form.existingImages.length - form.imageFiles.length
    const newFiles  = Array.from(files).slice(0, remaining)
    const previews  = newFiles.map((f) => URL.createObjectURL(f))
    setForm((prev) => ({ ...prev, imageFiles: [...prev.imageFiles, ...newFiles] }))
    setImagePreviews((p) => [...p, ...previews])
  }

  function removeNewImage(i: number) {
    setForm((prev) => {
      const files = [...prev.imageFiles]
      files.splice(i, 1)
      return { ...prev, imageFiles: files }
    })
    setImagePreviews((p) => { const arr = [...p]; arr.splice(i, 1); return arr })
  }

  function removeExistingImage(i: number) {
    setForm((prev) => {
      const imgs = [...prev.existingImages]
      imgs.splice(i, 1)
      return { ...prev, existingImages: imgs }
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const fd = new FormData()

    fd.append('title',        form.title)
    fd.append('description',  form.description)
    fd.append('sellingPrice', form.sellingPrice)
    if (form.originalPrice)  fd.append('originalPrice', form.originalPrice)
    fd.append('categoryId',  form.categoryId)
    fd.append('city',        form.city)
    fd.append('condition',   form.condition)
    fd.append('gender',      form.gender)
    fd.append('rarity',      form.rarity)
    if (form.brand)          fd.append('brand', form.brand)
    if (form.size)           fd.append('size',  form.size)
    if (form.fabric)         fd.append('fabric', form.fabric)
    if (form.era)            fd.append('era',   form.era)
    if (form.defects)        fd.append('defects', form.defects)
    if (form.visibleSpots)   fd.append('visibleSpots', form.visibleSpots)

    if (form.color.length)   fd.append('color', JSON.stringify(form.color))
    if (form.style.length)   fd.append('style', JSON.stringify(form.style))

    const tags = form.tags.split(',').map((t) => t.trim()).filter(Boolean)
    if (tags.length)         fd.append('tags', JSON.stringify(tags))

    const measObj = Object.fromEntries(form.measurements.filter((m) => m.key).map((m) => [m.key, m.value]))
    if (Object.keys(measObj).length) fd.append('measurements', JSON.stringify(measObj))

    form.imageFiles.forEach((f) => fd.append('images', f))

    onSubmit(fd)
  }

  const inputCls = 'pixel-input w-full px-4 py-2.5 text-sm bg-white'
  const totalImages = form.existingImages.length + form.imageFiles.length

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic info */}
      <section className="pixel-card overflow-hidden">
        <h2 className="pixel-section-header px-6 py-2 flex items-center gap-1.5"><ClipboardList size={16} /> Basic Info</h2>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Title *</label>
            <input type="text" required value={form.title} onChange={setField('title')} placeholder="e.g. Vintage Levi's 501 Jeans" className={inputCls} />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Description * <span className="text-gray-400 font-normal normal-case">(min 10 chars)</span></label>
            <textarea required value={form.description} onChange={setField('description')} rows={4} placeholder="Describe the item, its history, and condition details…" className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Selling Price (₹) *</label>
              <input type="number" required min={1} value={form.sellingPrice} onChange={setField('sellingPrice')} placeholder="899" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Original Price (₹) <span className="text-gray-400 font-normal normal-case">(optional)</span></label>
              <input type="number" min={1} value={form.originalPrice} onChange={setField('originalPrice')} placeholder="2499" className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Category *</label>
              <select required value={form.categoryId} onChange={setField('categoryId')} className={inputCls}>
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">City *</label>
              <input type="text" required value={form.city} onChange={setField('city')} placeholder="Mumbai" className={inputCls} />
            </div>
          </div>
        </div>
      </section>

      {/* Classification */}
      <section className="pixel-card overflow-hidden">
        <h2 className="pixel-section-header px-6 py-2 flex items-center gap-1.5"><Tag size={16} /> Classification</h2>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Condition *</label>
              <select value={form.condition} onChange={setField('condition')} className={inputCls}>
                {CONDITIONS.map((c) => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Gender *</label>
              <select value={form.gender} onChange={setField('gender')} className={inputCls}>
                {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Rarity</label>
              <select value={form.rarity} onChange={setField('rarity')} className={inputCls}>
                {RARITIES.map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Brand</label>
              <input type="text" value={form.brand} onChange={setField('brand')} placeholder="Levi's" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Size</label>
              <input type="text" value={form.size} onChange={setField('size')} placeholder="M / 32 / UK8" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Fabric</label>
              <input type="text" value={form.fabric} onChange={setField('fabric')} placeholder="100% Cotton" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Era</label>
              <input type="text" value={form.era} onChange={setField('era')} placeholder="90s" className={inputCls} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Colors <span className="text-gray-400 font-normal normal-case">(max 6)</span></label>
            <MultiPill options={COLORS} selected={form.color} onToggle={(v) => toggleArray('color', v)} max={6} />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Style Tags</label>
            <MultiPill options={STYLE_TAGS} selected={form.style} onToggle={(v) => toggleArray('style', v)} />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Tags <span className="text-gray-400 font-normal normal-case">(comma-separated)</span></label>
            <input type="text" value={form.tags} onChange={setField('tags')} placeholder="denim, flare, vintage-cut" className={inputCls} />
          </div>
        </div>
      </section>

      {/* Condition honesty */}
      <section className="pixel-card overflow-hidden">
        <h2 className="pixel-section-header px-6 py-2 flex items-center gap-1.5"><Search size={16} /> Condition Honesty</h2>
        <div className="p-6 space-y-4">
          <p className="text-xs text-gray-400">Be transparent — buyers trust sellers who describe flaws clearly.</p>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Defects</label>
            <textarea value={form.defects} onChange={setField('defects')} rows={2} placeholder="Small stain on left sleeve, barely visible…" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Visible Spots</label>
            <textarea value={form.visibleSpots} onChange={setField('visibleSpots')} rows={2} placeholder="Light pilling on collar area…" className={inputCls} />
          </div>
        </div>
      </section>

      {/* Measurements */}
      <section className="pixel-card overflow-hidden">
        <div className="pixel-section-header px-6 py-2 flex items-center justify-between">
          <h2>Measurements</h2>
          <button type="button" onClick={addMeasurement} className="text-xs text-brand-cream font-bold hover:opacity-80">
            + Add row
          </button>
        </div>
        <div className="p-6 space-y-4">
          {form.measurements.length === 0 && (
            <p className="text-xs text-gray-400">No measurements added yet.</p>
          )}
          {form.measurements.map((m, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                type="text"
                value={m.key}
                onChange={(e) => updateMeasurement(i, 'key', e.target.value)}
                placeholder="e.g. chest"
                className="flex-1 pixel-input px-3 py-2 text-sm bg-white"
              />
              <input
                type="text"
                value={m.value}
                onChange={(e) => updateMeasurement(i, 'value', e.target.value)}
                placeholder="e.g. 38 inches"
                className="flex-1 pixel-input px-3 py-2 text-sm bg-white"
              />
              <button type="button" onClick={() => removeMeasurement(i)} className="text-gray-400 hover:text-red-500 text-lg font-bold">×</button>
            </div>
          ))}
        </div>
      </section>

      {/* Images */}
      <section className="pixel-card overflow-hidden">
        <div className="pixel-section-header px-6 py-2 flex items-center justify-between">
          <h2 className="flex items-center gap-1.5"><Camera size={16} /> Images</h2>
          <span className="text-xs text-brand-cream/80">{totalImages}/5 uploaded</span>
        </div>
        <div className="p-6 space-y-4">
          {/* Existing images */}
          {form.existingImages.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {form.existingImages.map((url, i) => (
                <div key={url} className="relative w-24 h-24 overflow-hidden group pixel-border-sm">
                  <Image src={url} alt={`Image ${i + 1}`} fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(i)}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xl transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* New image previews */}
          {imagePreviews.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {imagePreviews.map((url, i) => (
                <div key={url} className="relative w-24 h-24 overflow-hidden group pixel-border-purple">
                  <img src={url} alt={`New ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeNewImage(i)}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xl transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {totalImages < 5 && (
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-[#1a0a3c] bg-brand-cream py-8 text-center text-gray-500 hover:border-brand-purple hover:text-brand-purple transition-colors"
              >
                <Camera size={32} className="mx-auto mb-1 text-gray-400" />
                <p className="text-sm font-bold uppercase tracking-wide">DROP YOUR FITS HERE</p>
                <p className="text-xs mt-1">JPEG, PNG, WebP · max 5 MB each</p>
              </button>
            </div>
          )}
        </div>
      </section>

      <button
        type="submit"
        disabled={loading}
        className="pixel-btn bg-brand-purple text-white font-bold w-full py-3 text-base disabled:opacity-60"
      >
        {loading ? 'Saving…' : submitLabel}
      </button>
    </form>
  )
}
