'use client'

import { useState, useRef, useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/authStore'
import { createVendorStore, updateVendorStore, fetchStore } from '@/lib/api'
import type { Store } from '@/lib/types'
import { Store as StoreIcon, Camera, FolderOpen, ClipboardList, Palette, Zap, Tag, Save } from 'lucide-react'

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal','Delhi','Jammu and Kashmir','Ladakh',
]
const STYLE_TAG_OPTIONS = ['Vintage','Y2K','Boho','Streetwear','90s','Cottagecore','Minimalist','Grunge','Indo-Western','Ethnic']
const BANNER_SWATCHES   = ['#5B21B6','#EA580C','#0F766E','#B45309','#1D4ED8','#BE185D']
const DROP_SCHEDULES    = ['Every Monday','Every Friday','Bi-weekly','Monthly','Custom']

export default function VendorStorePage() {
  const { vendorStoreId, setVendorStoreId, user } = useAuthStore()
  const router = useRouter()
  const avatarRef = useRef<HTMLInputElement>(null)

  // Fetch existing store data
  const { data: existingStore, isLoading: storeLoading } = useQuery<Store>({
    queryKey: ['vendor-store', vendorStoreId],
    queryFn:  () => fetchStore(vendorStoreId!),
    enabled:  !!vendorStoreId,
  })

  // Create store form state
  const [createForm, setCreateForm] = useState({ storeName: '', bio: '', city: '', state: '' })

  // Edit store form state
  const [bio,          setBio]          = useState('')
  const [bannerColor,  setBannerColor]  = useState('#5B21B6')
  const [dropSchedule, setDropSchedule] = useState('')
  const [styleTags,    setStyleTags]    = useState<string[]>([])
  const [avatarFile,   setAvatarFile]   = useState<File | null>(null)
  const [avatarPreview,setAvatarPreview]= useState<string | null>(null)
  const [success,      setSuccess]      = useState('')

  useEffect(() => {
    if (existingStore) {
      setBio(existingStore.description ?? '')
      setBannerColor(existingStore.bannerColor ?? '#5B21B6')
      setDropSchedule(existingStore.dropSchedule ?? '')
      setStyleTags(existingStore.styleTags ?? [])
    }
  }, [existingStore])

  const createMutation = useMutation({
    mutationFn: () => createVendorStore({
      storeName: createForm.storeName,
      bio:       createForm.bio || undefined,
      city:      createForm.city,
      state:     createForm.state || undefined,
    }),
    onSuccess: (store) => {
      setVendorStoreId(store.id)
      router.push('/vendor/store/customize')
    },
  })

  const updateMutation = useMutation({
    mutationFn: () => {
      const fd = new FormData()
      if (bio)          fd.append('bio',          bio)
      if (bannerColor)  fd.append('bannerColor',  bannerColor)
      if (dropSchedule) fd.append('dropSchedule', dropSchedule)
      if (styleTags.length) fd.append('styleTags', JSON.stringify(styleTags))
      if (avatarFile)   fd.append('avatarImage',  avatarFile)
      return updateVendorStore(vendorStoreId!, fd)
    },
    onSuccess: () => {
      setSuccess('Store updated successfully!')
      setTimeout(() => setSuccess(''), 3000)
    },
  })

  function toggleStyleTag(tag: string) {
    setStyleTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag])
  }

  const inputCls = 'pixel-input w-full px-4 py-2.5 text-sm bg-white'

  if (!vendorStoreId && !storeLoading) {
    return (
      <div className="p-8 max-w-lg mx-auto space-y-6">
        <div>
          <h1 className="font-heading text-3xl font-bold text-brand-purple uppercase tracking-wide flex items-center gap-2">
            <StoreIcon size={24} /> CREATE YOUR STORE
          </h1>
          <p className="text-gray-500 text-sm mt-1">Set up your thrift store to start selling.</p>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); createMutation.mutate() }}
          className="pixel-card p-6 space-y-4"
        >
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Store Name *</label>
            <input
              required
              value={createForm.storeName}
              onChange={(e) => setCreateForm((f) => ({ ...f, storeName: e.target.value }))}
              placeholder="e.g. Retro Rani"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Bio</label>
            <textarea
              value={createForm.bio}
              onChange={(e) => setCreateForm((f) => ({ ...f, bio: e.target.value }))}
              rows={3}
              placeholder="Tell buyers about your store…"
              className={inputCls}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">City *</label>
              <input
                required
                value={createForm.city}
                onChange={(e) => setCreateForm((f) => ({ ...f, city: e.target.value }))}
                placeholder="Mumbai"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">State</label>
              <select
                value={createForm.state}
                onChange={(e) => setCreateForm((f) => ({ ...f, state: e.target.value }))}
                className={inputCls}
              >
                <option value="">Select state</option>
                {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {createMutation.isError && (
            <p className="text-red-600 text-sm font-medium">{(createMutation.error as Error)?.message ?? 'Failed to create store'}</p>
          )}
          {success && <p className="text-green-600 text-sm font-medium">{success}</p>}

          <button
            type="submit"
            disabled={createMutation.isPending}
            className="pixel-btn bg-brand-purple text-white font-bold w-full py-3 disabled:opacity-60"
          >
            {createMutation.isPending ? 'Creating…' : 'Create Store'}
          </button>
        </form>
      </div>
    )
  }

  if (storeLoading) {
    return <div className="p-8 text-gray-400">Loading…</div>
  }

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-brand-purple uppercase tracking-wide flex items-center gap-2">
            <StoreIcon size={24} /> MY STORE
          </h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">{existingStore?.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/vendor/store/customize"
            className="pixel-btn bg-brand-saffron text-white px-4 py-2 text-sm font-bold inline-flex items-center gap-1.5"
          >
            <Palette size={16} /> CUSTOMIZE STORE
          </a>
          {existingStore?.id && (
            <a
              href={`/stores/${existingStore.id}`}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-brand-purple hover:underline font-medium"
            >
              View public page →
            </a>
          )}
        </div>
      </div>

      {/* Banner preview */}
      <div
        className="w-full h-28 flex items-end pb-4 px-5 transition-colors"
        style={{ backgroundColor: bannerColor, border: '3px solid #1a0a3c', boxShadow: '4px 4px 0 #1a0a3c' }}
      >
        <div className="flex items-center gap-3">
          {(avatarPreview ?? existingStore?.logo) ? (
            <img
              src={avatarPreview ?? existingStore?.logo ?? ''}
              alt="avatar"
              className="w-14 h-14 object-cover border-4 border-white shadow-md"
            />
          ) : (
            <div className="w-14 h-14 bg-white/30 border-4 border-white flex items-center justify-center text-white text-xl">
              <StoreIcon size={20} />
            </div>
          )}
          <p className="text-white font-bold text-lg drop-shadow">{existingStore?.name}</p>
        </div>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); updateMutation.mutate() }}
        className="space-y-5"
      >
        {/* Avatar upload */}
        <div className="pixel-card p-5">
          <p className="pixel-section-header -mx-5 -mt-5 mb-4 px-5 py-2 flex items-center gap-2">
            <Camera size={16} /> Store Avatar
          </p>
          <input
            ref={avatarRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) {
                setAvatarFile(f)
                setAvatarPreview(URL.createObjectURL(f))
              }
            }}
          />
          <button
            type="button"
            onClick={() => avatarRef.current?.click()}
            className="pixel-border-sm px-4 py-2 text-sm text-gray-600 hover:text-brand-purple font-medium bg-white"
          >
            {avatarFile ? avatarFile.name : <span className="flex items-center gap-2"><FolderOpen size={16} /> Change avatar image</span>}
          </button>
        </div>

        {/* Bio */}
        <div className="pixel-card p-5 space-y-3">
          <p className="pixel-section-header -mx-5 -mt-5 mb-4 px-5 py-2 flex items-center gap-2">
            <ClipboardList size={16} /> Bio
          </p>
          <div>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Tell buyers about your store…"
              className={inputCls}
            />
          </div>
        </div>

        {/* Banner color */}
        <div className="pixel-card p-5">
          <p className="pixel-section-header -mx-5 -mt-5 mb-4 px-5 py-2 flex items-center gap-2">
            <Palette size={16} /> Banner Color
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            {BANNER_SWATCHES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setBannerColor(c)}
                style={{ backgroundColor: c }}
                className={`w-9 h-9 border-4 transition-all ${bannerColor === c ? 'border-gray-800 scale-110' : 'border-transparent'}`}
              />
            ))}
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={bannerColor}
                onChange={(e) => setBannerColor(e.target.value)}
                className="w-9 h-9 cursor-pointer pixel-border-sm"
              />
              <span className="text-xs text-gray-400 font-mono">{bannerColor}</span>
            </div>
          </div>
        </div>

        {/* Drop schedule */}
        <div className="pixel-card p-5">
          <p className="pixel-section-header -mx-5 -mt-5 mb-4 px-5 py-2 flex items-center gap-2">
            <Zap size={16} /> Drop Schedule
          </p>
          <div className="flex flex-wrap gap-2">
            {DROP_SCHEDULES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setDropSchedule(dropSchedule === s ? '' : s)}
                className={`px-3 py-1.5 text-xs font-bold transition-colors ${
                  dropSchedule === s
                    ? 'pixel-btn-sm bg-brand-purple text-white'
                    : 'pixel-btn-sm bg-white text-gray-600 hover:text-brand-purple'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          {dropSchedule === 'Custom' && (
            <input
              type="text"
              placeholder="e.g. Every Tuesday at 6pm"
              value={dropSchedule === 'Custom' ? '' : dropSchedule}
              onChange={(e) => setDropSchedule(e.target.value)}
              className={`mt-3 ${inputCls}`}
            />
          )}
        </div>

        {/* Style tags */}
        <div className="pixel-card p-5">
          <p className="pixel-section-header -mx-5 -mt-5 mb-4 px-5 py-2 flex items-center gap-2">
            <Tag size={16} /> Style Tags
          </p>
          <div className="flex flex-wrap gap-2">
            {STYLE_TAG_OPTIONS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleStyleTag(tag)}
                className={`px-3 py-1.5 text-xs font-bold transition-colors ${
                  styleTags.includes(tag)
                    ? 'pixel-btn-sm bg-brand-saffron text-white'
                    : 'pixel-btn-sm bg-white text-gray-600 hover:text-brand-saffron'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {updateMutation.isError && (
          <p className="text-red-600 text-sm font-medium">{(updateMutation.error as Error)?.message ?? 'Failed to update store'}</p>
        )}
        {success && <p className="text-green-600 text-sm font-bold bg-green-50 px-4 py-2">{success}</p>}

        <button
          type="submit"
          disabled={updateMutation.isPending}
          className="pixel-btn bg-brand-purple text-white font-bold w-full py-4 disabled:opacity-60"
        >
          {updateMutation.isPending ? 'Saving…' : <span className="flex items-center justify-center gap-2"><Save size={16} /> Save Changes</span>}
        </button>
      </form>
    </div>
  )
}
