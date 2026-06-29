'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useAuthStore } from '@/lib/authStore'
import { fetchStore, saveStoreTheme } from '@/lib/api'
import type { StoreTheme, StoreThemeSticker } from '@/lib/types'
import { ArrowLeft, Check, X, FolderOpen, Save, Store, Zap, MessageSquare, Sparkles, Star } from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────

const STICKERS = [
  '✨','🌸','👗','👟','🧥','💜','🔥','⭐','🎀','🛍️',
  '🌈','🦋','🌻','💫','🎵','🌙','⚡','🍀','🎨','🦚',
  '👑','💎','🌺','🎭','🍭','🎪','🌟','💝','🔮','🎠',
]

const FONT_COMBOS = [
  { id: 'retro',       label: 'Retro',       headingFont: "'Playfair Display', serif",  bodyFont: "'Courier New', monospace", google: 'Playfair+Display:wght@700' },
  { id: 'minimal',     label: 'Minimal',      headingFont: 'Inter, sans-serif',          bodyFont: 'Inter, sans-serif',        google: null },
  { id: 'handwritten', label: 'Handwritten',  headingFont: "'Caveat', cursive",          bodyFont: 'Inter, sans-serif',        google: 'Caveat:wght@700' },
  { id: 'bold',        label: 'Bold',         headingFont: "'Black Han Sans', sans-serif", bodyFont: 'Inter, sans-serif',      google: 'Black+Han+Sans' },
  { id: 'dreamy',      label: 'Dreamy',       headingFont: "'Satisfy', cursive",         bodyFont: "'Lato', sans-serif",       google: 'Satisfy&family=Lato:wght@400;700' },
] as const

const PATTERNS = ['none','dots','stripes','checkerboard','zigzag','grid'] as const

const GRADIENT_DIRS = [
  { label: 'Horizontal', value: '90deg' },
  { label: 'Vertical',   value: '180deg' },
  { label: 'Diagonal',   value: '135deg' },
  { label: 'Radial',     value: 'radial' },
]

const PRODUCT_LAYOUTS = [
  { id: 'grid',     label: 'Grid',     desc: '3 col' },
  { id: 'list',     label: 'List',     desc: 'Vertical' },
  { id: 'magazine', label: 'Magazine', desc: 'Masonry' },
  { id: 'polaroid', label: 'Polaroid', desc: 'Rotated' },
] as const

const BORDER_STYLES = ['none','solid','dashed','double','retro'] as const

const EFFECTS = [
  { id: 'none',      label: 'None' },
  { id: 'sparkles',  label: 'Sparkles' },
  { id: 'stars',     label: 'Stars' },
  { id: 'confetti',  label: 'Confetti' },
] as const

const MARQUEE_SPEEDS = [
  { id: 'slow',   label: 'Slow',   secs: 22 },
  { id: 'medium', label: 'Medium', secs: 13 },
  { id: 'fast',   label: 'Fast',   secs: 6 },
] as const

const DEFAULT_THEME: StoreTheme = {
  bannerType:              'solid',
  bannerColor1:            '#5B21B6',
  bannerColor2:            '#F59E0B',
  bannerGradientDirection: '135deg',
  bannerImageUrl:          null,
  bgColor:                 '#FEFCE8',
  bgPattern:               'none',
  bgPatternOpacity:        30,
  stickers:                [],
  marqueeText:             '',
  marqueeSpeed:            'medium',
  pageEffect:              'none',
  fontStyle:               'minimal',
  accentColor:             '#5B21B6',
  productLayout:           'grid',
  borderStyle:             'none',
  borderColor:             '#5B21B6',
  showReviews:             true,
  showDrops:               true,
  showAbout:               true,
}

type Tab = 'banner' | 'background' | 'vibes' | 'typography' | 'layout'

// ─── Style helpers ────────────────────────────────────────────────────────────

function getBannerStyle(t: StoreTheme): React.CSSProperties {
  if (t.bannerType === 'image' && t.bannerImageUrl) {
    return { backgroundImage: `url(${t.bannerImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
  }
  if (t.bannerType === 'gradient') {
    if (t.bannerGradientDirection === 'radial') {
      return { background: `radial-gradient(circle, ${t.bannerColor1 ?? '#5B21B6'}, ${t.bannerColor2 ?? '#F59E0B'})` }
    }
    return { background: `linear-gradient(${t.bannerGradientDirection ?? '135deg'}, ${t.bannerColor1 ?? '#5B21B6'}, ${t.bannerColor2 ?? '#F59E0B'})` }
  }
  return { backgroundColor: t.bannerColor1 ?? '#5B21B6' }
}

function getPatternStyle(pattern: string, opacity: number): React.CSSProperties {
  const a = opacity / 100
  const c = `rgba(0,0,0,${a})`
  switch (pattern) {
    case 'dots':
      return { backgroundImage: `radial-gradient(circle, ${c} 1px, transparent 1px)`, backgroundSize: '20px 20px' }
    case 'stripes':
      return { backgroundImage: `repeating-linear-gradient(45deg, ${c}, ${c} 1px, transparent 1px, transparent 10px)` }
    case 'checkerboard':
      return {
        backgroundImage: `linear-gradient(45deg,${c} 25%,transparent 25%),linear-gradient(-45deg,${c} 25%,transparent 25%),linear-gradient(45deg,transparent 75%,${c} 75%),linear-gradient(-45deg,transparent 75%,${c} 75%)`,
        backgroundSize: '20px 20px',
        backgroundPosition: '0 0,0 10px,10px -10px,-10px 0px',
      }
    case 'zigzag':
      return {
        backgroundImage: `linear-gradient(135deg,${c} 25%,transparent 25%),linear-gradient(225deg,${c} 25%,transparent 25%),linear-gradient(315deg,${c} 25%,transparent 25%),linear-gradient(45deg,${c} 25%,transparent 25%)`,
        backgroundSize: '20px 20px',
        backgroundPosition: '-10px 0,-10px 0,0 0,0 0',
      }
    case 'grid':
      return {
        backgroundImage: `linear-gradient(${c} 1px,transparent 1px),linear-gradient(90deg,${c} 1px,transparent 1px)`,
        backgroundSize: '20px 20px',
      }
    default:
      return {}
  }
}

function getBorderCss(t: StoreTheme): React.CSSProperties {
  const s = t.borderStyle
  if (!s || s === 'none') return {}
  const c = t.borderColor ?? '#5B21B6'
  if (s === 'retro') return { border: `4px solid ${c}`, boxShadow: `6px 6px 0 0 ${c}` }
  if (s === 'double') return { border: `3px double ${c}` }
  return { border: `2px ${s} ${c}` }
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 shadow-lg text-white text-sm font-bold animate-bounce-in pixel-border ${type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
      <span className="flex items-center gap-2">{type === 'success' ? <Check size={16} /> : <X size={16} />}{message}</span>
    </div>
  )
}

// ─── Page-effect overlay (preview) ───────────────────────────────────────────

function EffectOverlay({ effect }: { effect: string }) {
  const items = useMemo(() => {
    if (effect === 'none') return []
    const count = effect === 'confetti' ? 40 : 16
    const confettiColors = ['#FF6B6B','#4ECDC4','#45B7D1','#F7B731','#5B21B6','#EA580C']
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left:     `${(i * 7.3 + 5) % 100}%`,
      delay:    `${(i * 0.23) % 3}s`,
      duration: `${1.8 + (i * 0.17) % 2}s`,
      color: confettiColors[i % confettiColors.length],
      rotate: (i * 37) % 360,
    }))
  }, [effect])

  if (effect === 'none') return null

  const keyframes = `
    @keyframes sparkle-anim { 0%,100%{opacity:0;transform:scale(0) rotate(0deg)} 50%{opacity:1;transform:scale(1) rotate(180deg)} }
    @keyframes fall-anim { from{transform:translateY(-10px) rotate(0deg);opacity:1} to{transform:translateY(105%);opacity:0} }
    @keyframes confetti-anim { from{transform:translateY(-10px) rotate(0deg)} to{transform:translateY(105%) rotate(720deg)} }
  `

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
      <style>{keyframes}</style>
      {items.map((item) => (
        <div
          key={item.id}
          className="absolute"
          style={{
            left: item.left,
            top: effect === 'sparkles' ? `${(item.id * 11 + 10) % 85}%` : '-12px',
            animation: `${effect === 'sparkles' ? 'sparkle-anim' : effect === 'stars' ? 'fall-anim' : 'confetti-anim'} ${item.duration} ${item.delay} infinite ${effect === 'confetti' ? 'linear' : 'ease-in-out'}`,
          }}
        >
          {effect === 'confetti'
            ? <div style={{ width: 8, height: 12, backgroundColor: item.color, transform: `rotate(${item.rotate}deg)` }} />
            : effect === 'stars' ? <Star size={14} fill="currentColor" />
            : <Sparkles size={14} />}
        </div>
      ))}
    </div>
  )
}

// ─── Store Preview ────────────────────────────────────────────────────────────

function StorePreview({
  theme,
  storeName,
  logoUrl,
  bannerFileUrl,
  bannerRef,
  onStickerMouseDown,
  onBannerMouseMove,
  onBannerMouseUp,
}: {
  theme: StoreTheme
  storeName: string
  logoUrl?: string
  bannerFileUrl?: string
  bannerRef: React.RefObject<HTMLDivElement>
  onStickerMouseDown: (e: React.MouseEvent, i: number) => void
  onBannerMouseMove: (e: React.MouseEvent) => void
  onBannerMouseUp: () => void
}) {
  const font = FONT_COMBOS.find((f) => f.id === theme.fontStyle) ?? FONT_COMBOS[1]
  const effectiveBannerImageUrl = bannerFileUrl ?? theme.bannerImageUrl ?? null
  const effectiveBannerStyle = effectiveBannerImageUrl && theme.bannerType === 'image'
    ? { backgroundImage: `url(${effectiveBannerImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : getBannerStyle(theme)

  const marqueeSecs = MARQUEE_SPEEDS.find((s) => s.id === theme.marqueeSpeed)?.secs ?? 13
  const accent = theme.accentColor ?? '#5B21B6'
  const patternStyle = getPatternStyle(theme.bgPattern ?? 'none', theme.bgPatternOpacity ?? 30)

  return (
    <div
      className="pixel-border overflow-hidden select-none relative"
      style={{ ...getBorderCss(theme), fontFamily: font.bodyFont }}
    >
      {/* Background */}
      <div
        className="relative"
        style={{ backgroundColor: theme.bgColor ?? '#FEFCE8', ...patternStyle }}
      >
        <EffectOverlay effect={theme.pageEffect ?? 'none'} />

        {/* Banner */}
        <div
          ref={bannerRef}
          className="relative w-full h-36 cursor-crosshair"
          style={effectiveBannerStyle}
          onMouseMove={onBannerMouseMove}
          onMouseUp={onBannerMouseUp}
          onMouseLeave={onBannerMouseUp}
        >
          {/* Stickers */}
          {(theme.stickers ?? []).map((s, i) => (
            <span
              key={i}
              className="absolute cursor-grab active:cursor-grabbing leading-none"
              style={{ left: `${s.x}%`, top: `${s.y}%`, fontSize: s.size, lineHeight: 1, userSelect: 'none' }}
              onMouseDown={(e) => onStickerMouseDown(e, i)}
            >
              {s.emoji}
            </span>
          ))}
        </div>

        {/* Marquee */}
        {theme.marqueeText && (
          <div
            className="overflow-hidden whitespace-nowrap text-xs py-1.5 font-semibold"
            style={{ backgroundColor: accent, color: '#fff' }}
          >
            <style>{`
              @keyframes marquee-scroll { from{transform:translateX(100%)} to{transform:translateX(-100%)} }
            `}</style>
            <span style={{ display: 'inline-block', animation: `marquee-scroll ${marqueeSecs}s linear infinite` }}>
              {theme.marqueeText}
            </span>
          </div>
        )}

        {/* Store header */}
        <div className="px-4 pt-3 pb-2 flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-300 flex-shrink-0 overflow-hidden border-2 border-white shadow">
            {logoUrl
              ? <img src={logoUrl} alt="logo" className="w-full h-full object-cover" />
              : <span className="w-full h-full flex items-center justify-center"><Store size={20} /></span>}
          </div>
          <div>
            <p className="font-bold text-gray-900" style={{ fontFamily: font.headingFont, fontSize: 16 }}>{storeName || 'My Store'}</p>
            <p className="text-xs text-gray-500">Mumbai, Maharashtra · 128 followers</p>
          </div>
          <button
            className="ml-auto text-xs font-semibold px-3 py-1.5 text-white"
            style={{ backgroundColor: accent }}
          >Follow</button>
        </div>

        {/* Product grid placeholder */}
        <div className="px-4 pb-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Products</p>
          {(theme.productLayout === 'list') ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-2 bg-white p-2 shadow-sm">
                  <div className="w-14 h-14 bg-gray-200 flex-shrink-0" />
                  <div className="flex-1 space-y-1 pt-1">
                    <div className="h-2.5 bg-gray-200 w-3/4" />
                    <div className="h-2 bg-gray-100 w-1/2" />
                    <div className="h-3 w-1/3" style={{ backgroundColor: accent + '33' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (theme.productLayout === 'magazine') ? (
            <div className="columns-2 gap-2 space-y-2">
              {[56, 40, 64, 48, 52].map((h, i) => (
                <div key={i} className="break-inside-avoid bg-white shadow-sm overflow-hidden mb-2">
                  <div className="w-full bg-gray-200" style={{ height: h }} />
                  <div className="p-1.5 space-y-1">
                    <div className="h-2 bg-gray-200 w-3/4" />
                    <div className="h-2.5 w-1/2" style={{ backgroundColor: accent + '33' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 6 }).map((_, i) => {
                const isPolaroid = theme.productLayout === 'polaroid'
                const rot = isPolaroid ? (i % 2 === 0 ? '-1.5deg' : '1.5deg') : '0deg'
                return (
                  <div
                    key={i}
                    className="bg-white overflow-hidden shadow-sm"
                    style={{
                      transform: `rotate(${rot})`,
                      boxShadow: isPolaroid ? '0 4px 12px rgba(0,0,0,0.15)' : undefined,
                      padding: isPolaroid ? '4px 4px 16px' : undefined,
                    }}
                  >
                    <div className="w-full h-16 bg-gray-200" />
                    {!isPolaroid && (
                      <div className="p-1.5 space-y-1">
                        <div className="h-2 bg-gray-100 w-3/4" />
                        <div className="h-2.5 w-1/2" style={{ backgroundColor: accent + '33' }} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Section toggles preview */}
        <div className="px-4 pb-4 flex gap-2 flex-wrap">
          {theme.showDrops && (
            <span className="text-xs px-2 py-1 font-medium flex items-center gap-1" style={{ backgroundColor: accent + '22', color: accent }}><Zap size={12} /> Drops</span>
          )}
          {theme.showReviews && (
            <span className="text-xs px-2 py-1 font-medium flex items-center gap-1" style={{ backgroundColor: accent + '22', color: accent }}><MessageSquare size={12} /> Reviews</span>
          )}
          {theme.showAbout && (
            <span className="text-xs px-2 py-1 font-medium" style={{ backgroundColor: accent + '22', color: accent }}>About</span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Tab components ───────────────────────────────────────────────────────────

function ColorPicker({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-9 h-9 cursor-pointer pixel-border-sm p-0.5"
      />
      <span className="text-xs text-gray-500 font-mono">{value}</span>
      <span className="text-xs text-gray-400">{label}</span>
    </div>
  )
}

function BannerTab({ theme, setTheme, bannerFile, setBannerFile, setBannerFileUrl }: {
  theme: StoreTheme
  setTheme: (fn: (t: StoreTheme) => StoreTheme) => void
  bannerFile: File | null
  setBannerFile: (f: File | null) => void
  setBannerFileUrl: (u: string | null) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)

  const set = useCallback(<K extends keyof StoreTheme>(key: K, val: StoreTheme[K]) =>
    setTheme((t) => ({ ...t, [key]: val })), [setTheme])

  return (
    <div className="space-y-5">
      {/* Banner type selector */}
      <div className="pixel-border p-4">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Banner type</p>
        <div className="flex gap-2">
          {(['solid', 'gradient', 'image'] as const).map((type) => (
            <button
              key={type}
              onClick={() => set('bannerType', type)}
              className={`flex-1 py-2.5 text-sm font-bold capitalize pixel-btn-sm ${
                theme.bannerType === type
                  ? 'bg-brand-purple text-white'
                  : 'bg-white text-gray-600'
              }`}
            >
              {type === 'solid' ? 'Solid' : type === 'gradient' ? 'Gradient' : 'Image'}
            </button>
          ))}
        </div>
      </div>

      {/* Solid */}
      {theme.bannerType === 'solid' && (
        <div className="pixel-border p-4">
          <ColorPicker
            value={theme.bannerColor1 ?? '#5B21B6'}
            onChange={(v) => set('bannerColor1', v)}
            label="Banner color"
          />
        </div>
      )}

      {/* Gradient */}
      {theme.bannerType === 'gradient' && (
        <div className="pixel-border p-4 space-y-4">
          <div className="flex gap-3 flex-wrap">
            <ColorPicker
              value={theme.bannerColor1 ?? '#5B21B6'}
              onChange={(v) => set('bannerColor1', v)}
              label="Color 1"
            />
            <ColorPicker
              value={theme.bannerColor2 ?? '#F59E0B'}
              onChange={(v) => set('bannerColor2', v)}
              label="Color 2"
            />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Direction</p>
            <div className="grid grid-cols-2 gap-2">
              {GRADIENT_DIRS.map((d) => (
                <button
                  key={d.value}
                  onClick={() => set('bannerGradientDirection', d.value)}
                  className={`py-2 text-xs font-bold pixel-btn-sm ${
                    theme.bannerGradientDirection === d.value
                      ? 'bg-brand-purple text-white'
                      : 'bg-white text-gray-600'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Image */}
      {theme.bannerType === 'image' && (
        <div className="pixel-border p-4 space-y-3">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) {
                setBannerFile(f)
                setBannerFileUrl(URL.createObjectURL(f))
              }
            }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full py-3 border-2 border-dashed border-[#1a0a3c] text-sm text-gray-500 hover:border-brand-purple hover:text-brand-purple transition-colors"
          >
            {bannerFile ? <span className="flex items-center gap-2"><Check size={16} />{bannerFile.name}</span> : <span className="flex items-center gap-2"><FolderOpen size={16} />Upload cover image</span>}
          </button>
          <p className="text-xs text-gray-400 text-center">Or paste an image URL</p>
          <input
            type="url"
            placeholder="https://..."
            value={theme.bannerImageUrl ?? ''}
            onChange={(e) => set('bannerImageUrl', e.target.value || null)}
            className="w-full pixel-input px-3 py-2 text-sm bg-white"
          />
        </div>
      )}
    </div>
  )
}

function BackgroundTab({ theme, setTheme }: {
  theme: StoreTheme
  setTheme: (fn: (t: StoreTheme) => StoreTheme) => void
}) {
  const set = useCallback(<K extends keyof StoreTheme>(key: K, val: StoreTheme[K]) =>
    setTheme((t) => ({ ...t, [key]: val })), [setTheme])

  const patternLabels: Record<string, string> = {
    none: 'None', dots: 'Dots', stripes: 'Stripes',
    checkerboard: 'Checker', zigzag: 'Zigzag', grid: 'Grid',
  }

  return (
    <div className="space-y-5">
      <div className="pixel-border p-4">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Background color</p>
        <ColorPicker
          value={theme.bgColor ?? '#FEFCE8'}
          onChange={(v) => set('bgColor', v)}
          label="Page background"
        />
      </div>

      <div className="pixel-border p-4">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Pattern overlay</p>
        <div className="grid grid-cols-3 gap-2">
          {PATTERNS.map((p) => (
            <button
              key={p}
              onClick={() => set('bgPattern', p)}
              className={`py-3 text-xs font-bold pixel-btn-sm ${
                theme.bgPattern === p
                  ? 'bg-brand-purple text-white'
                  : 'bg-white text-gray-600'
              }`}
            >
              {patternLabels[p]}
            </button>
          ))}
        </div>
      </div>

      {(theme.bgPattern ?? 'none') !== 'none' && (
        <div className="pixel-border p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pattern opacity</p>
            <span className="text-xs text-brand-purple font-bold">{theme.bgPatternOpacity ?? 30}%</span>
          </div>
          <input
            type="range"
            min={5}
            max={80}
            value={theme.bgPatternOpacity ?? 30}
            onChange={(e) => set('bgPatternOpacity', Number(e.target.value))}
            className="w-full accent-brand-purple"
          />
        </div>
      )}
    </div>
  )
}

function VibesTab({ theme, setTheme }: {
  theme: StoreTheme
  setTheme: (fn: (t: StoreTheme) => StoreTheme) => void
}) {
  const set = useCallback(<K extends keyof StoreTheme>(key: K, val: StoreTheme[K]) =>
    setTheme((t) => ({ ...t, [key]: val })), [setTheme])

  function addSticker(emoji: string) {
    setTheme((t) => ({
      ...t,
      stickers: [...(t.stickers ?? []), { emoji, x: 10 + Math.random() * 70, y: 15 + Math.random() * 55, size: 32 }],
    }))
  }

  function updateSticker(i: number, patch: Partial<StoreThemeSticker>) {
    setTheme((t) => ({
      ...t,
      stickers: (t.stickers ?? []).map((s, idx) => idx === i ? { ...s, ...patch } : s),
    }))
  }

  function removeSticker(i: number) {
    setTheme((t) => ({ ...t, stickers: (t.stickers ?? []).filter((_, idx) => idx !== i) }))
  }

  const stickers = theme.stickers ?? []

  return (
    <div className="space-y-5">
      {/* Sticker picker */}
      <div className="pixel-border p-4">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Add sticker (drag on preview →)</p>
        <div className="grid grid-cols-6 gap-1">
          {STICKERS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => addSticker(emoji)}
              disabled={stickers.length >= 20}
              className="text-xl p-1.5 hover:bg-purple-50 hover:scale-110 transition-all disabled:opacity-40"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Placed stickers */}
      {stickers.length > 0 && (
        <div className="pixel-border p-4 space-y-2">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Placed stickers</p>
          {stickers.map((s, i) => (
            <div key={i} className="flex items-center gap-3 bg-gray-50 px-3 py-2" style={{ border: '1px solid rgba(26,10,60,0.1)' }}>
              <span className="text-xl w-8 text-center">{s.emoji}</span>
              <input
                type="range"
                min={16}
                max={72}
                value={s.size}
                onChange={(e) => updateSticker(i, { size: Number(e.target.value) })}
                className="flex-1 accent-brand-purple"
                title="Size"
              />
              <span className="text-xs text-gray-400 w-8 text-right">{s.size}px</span>
              <button
                onClick={() => removeSticker(i)}
                className="text-red-400 hover:text-red-600 text-sm ml-1 font-bold"
                title="Remove"
              >✕</button>
            </div>
          ))}
        </div>
      )}

      {/* Marquee */}
      <div className="pixel-border p-4">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Marquee text</p>
        <input
          type="text"
          placeholder="New drop every Friday 6PM"
          value={theme.marqueeText ?? ''}
          onChange={(e) => set('marqueeText', e.target.value || null)}
          className="w-full pixel-input px-3 py-2.5 text-sm bg-white"
        />
        {theme.marqueeText && (
          <div className="flex gap-2 mt-2">
            {MARQUEE_SPEEDS.map((s) => (
              <button
                key={s.id}
                onClick={() => set('marqueeSpeed', s.id)}
                className={`flex-1 py-1.5 text-xs font-bold pixel-btn-sm ${
                  theme.marqueeSpeed === s.id
                    ? 'bg-brand-purple text-white'
                    : 'bg-white text-gray-500'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Page effect */}
      <div className="pixel-border p-4">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Page load effect</p>
        <div className="grid grid-cols-2 gap-2">
          {EFFECTS.map((ef) => (
            <button
              key={ef.id}
              onClick={() => set('pageEffect', ef.id as StoreTheme['pageEffect'])}
              className={`py-2.5 text-sm font-bold pixel-btn-sm ${
                theme.pageEffect === ef.id
                  ? 'bg-brand-purple text-white'
                  : 'bg-white text-gray-600'
              }`}
            >
              {ef.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function TypographyTab({ theme, setTheme }: {
  theme: StoreTheme
  setTheme: (fn: (t: StoreTheme) => StoreTheme) => void
}) {
  const set = useCallback(<K extends keyof StoreTheme>(key: K, val: StoreTheme[K]) =>
    setTheme((t) => ({ ...t, [key]: val })), [setTheme])

  return (
    <div className="space-y-5">
      <div className="pixel-border p-4">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Font style</p>
        <div className="space-y-2">
          {FONT_COMBOS.map((f) => (
            <button
              key={f.id}
              onClick={() => set('fontStyle', f.id as StoreTheme['fontStyle'])}
              className={`w-full px-4 py-3 text-left transition-all pixel-btn-sm ${
                theme.fontStyle === f.id
                  ? 'bg-brand-purple text-white'
                  : 'bg-white text-gray-800'
              }`}
            >
              <p className="text-base font-bold" style={{ fontFamily: f.headingFont }}>
                {f.label}
              </p>
              <p className="text-xs opacity-70" style={{ fontFamily: f.bodyFont }}>
                Sample body text
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="pixel-border p-4">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Accent color</p>
        <p className="text-xs text-gray-400 mb-2">Applied to prices, badges, and buttons</p>
        <ColorPicker
          value={theme.accentColor ?? '#5B21B6'}
          onChange={(v) => set('accentColor', v)}
          label="Accent"
        />
      </div>
    </div>
  )
}

function LayoutTab({ theme, setTheme }: {
  theme: StoreTheme
  setTheme: (fn: (t: StoreTheme) => StoreTheme) => void
}) {
  const set = useCallback(<K extends keyof StoreTheme>(key: K, val: StoreTheme[K]) =>
    setTheme((t) => ({ ...t, [key]: val })), [setTheme])

  const borderLabels: Record<string, string> = {
    none: 'None', solid: 'Solid', dashed: 'Dashed', double: 'Double', retro: 'Retro'
  }

  return (
    <div className="space-y-5">
      {/* Product layout */}
      <div className="pixel-border p-4">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Product grid style</p>
        <div className="grid grid-cols-2 gap-2">
          {PRODUCT_LAYOUTS.map((l) => (
            <button
              key={l.id}
              onClick={() => set('productLayout', l.id as StoreTheme['productLayout'])}
              className={`py-3 text-sm font-bold pixel-btn-sm ${
                theme.productLayout === l.id
                  ? 'bg-brand-purple text-white'
                  : 'bg-white text-gray-600'
              }`}
            >
              <span className="block font-bold">{l.label}</span>
              <span className="text-xs opacity-70">{l.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Border style */}
      <div className="pixel-border p-4">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Page border</p>
        <div className="grid grid-cols-3 gap-2">
          {BORDER_STYLES.map((b) => (
            <button
              key={b}
              onClick={() => set('borderStyle', b as StoreTheme['borderStyle'])}
              className={`py-2.5 text-xs font-bold capitalize pixel-btn-sm ${
                theme.borderStyle === b
                  ? 'bg-brand-purple text-white'
                  : 'bg-white text-gray-600'
              }`}
            >
              {borderLabels[b]}
            </button>
          ))}
        </div>
        {(theme.borderStyle ?? 'none') !== 'none' && (
          <div className="mt-3">
            <ColorPicker
              value={theme.borderColor ?? '#5B21B6'}
              onChange={(v) => set('borderColor', v)}
              label="Border color"
            />
          </div>
        )}
      </div>

      {/* Show/hide sections */}
      <div className="pixel-border p-4">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Sections</p>
        <div className="space-y-2">
          {([
            { key: 'showReviews' as const, label: 'Reviews section' },
            { key: 'showDrops'   as const, label: 'Drops section' },
            { key: 'showAbout'   as const, label: 'About section' },
          ]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => set(key, !theme[key])}
              className={`w-full flex items-center justify-between px-4 py-3 pixel-btn-sm ${
                theme[key]
                  ? 'bg-brand-purple text-white'
                  : 'bg-white text-gray-400'
              }`}
            >
              <span className="text-sm font-bold">{label}</span>
              <span className="text-xs font-bold">{theme[key] ? 'Visible' : 'Hidden'}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CustomizePage() {
  const { vendorStoreId } = useAuthStore()
  const storeId = vendorStoreId

  const [theme, setTheme] = useState<StoreTheme>(DEFAULT_THEME)
  const [activeTab, setActiveTab] = useState<Tab>('banner')
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [bannerFileUrl, setBannerFileUrl] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [draftLoaded, setDraftLoaded] = useState(false)

  const bannerRef = useRef<HTMLDivElement>(null)
  const dragState = useRef<{ index: number; origX: number; origY: number; mouseX: number; mouseY: number } | null>(null)

  // ── Fetch store ──────────────────────────────────────────────────────────────
  const { data: store } = useQuery({
    queryKey: ['vendor-store', storeId],
    queryFn:  () => fetchStore(storeId!),
    enabled:  !!storeId,
  })

  // ── Load draft from localStorage, fallback to server theme ──────────────────
  useEffect(() => {
    if (!storeId || draftLoaded) return
    const draftKey = `thrift_theme_draft_${storeId}`
    const saved = localStorage.getItem(draftKey)
    if (saved) {
      try {
        setTheme(JSON.parse(saved) as StoreTheme)
        setDraftLoaded(true)
        return
      } catch {}
    }
    if (store?.storeTheme) {
      setTheme(store.storeTheme as StoreTheme)
    }
    setDraftLoaded(true)
  }, [storeId, store, draftLoaded])

  // ── Auto-save draft to localStorage ─────────────────────────────────────────
  useEffect(() => {
    if (!storeId || !draftLoaded) return
    const draftKey = `thrift_theme_draft_${storeId}`
    localStorage.setItem(draftKey, JSON.stringify(theme))
  }, [theme, storeId, draftLoaded])

  // ── Load Google Fonts for preview ────────────────────────────────────────────
  useEffect(() => {
    const combo = FONT_COMBOS.find((f) => f.id === theme.fontStyle)
    if (!combo?.google) return
    const id = `gf-${combo.id}`
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?family=${combo.google}&display=swap`
    document.head.appendChild(link)
  }, [theme.fontStyle])

  // ── Sticker drag ─────────────────────────────────────────────────────────────
  const handleStickerMouseDown = useCallback((e: React.MouseEvent, index: number) => {
    e.preventDefault()
    e.stopPropagation()
    const stickers = theme.stickers ?? []
    dragState.current = {
      index,
      origX: stickers[index].x,
      origY: stickers[index].y,
      mouseX: e.clientX,
      mouseY: e.clientY,
    }
  }, [theme.stickers])

  const handleBannerMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragState.current || !bannerRef.current) return
    const { index, origX, origY, mouseX, mouseY } = dragState.current
    const rect = bannerRef.current.getBoundingClientRect()
    const dx = ((e.clientX - mouseX) / rect.width)  * 100
    const dy = ((e.clientY - mouseY) / rect.height) * 100
    setTheme((t) => ({
      ...t,
      stickers: (t.stickers ?? []).map((s, i) =>
        i === index ? { ...s, x: Math.max(0, Math.min(93, origX + dx)), y: Math.max(0, Math.min(75, origY + dy)) } : s
      ),
    }))
  }, [])

  const handleBannerMouseUp = useCallback(() => {
    dragState.current = null
  }, [])

  // ── Save ─────────────────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: () => saveStoreTheme(storeId!, theme, bannerFile ?? undefined),
    onSuccess: () => {
      setToast({ message: 'Store updated!', type: 'success' })
      setBannerFile(null)
      setBannerFileUrl(null)
      if (storeId) localStorage.removeItem(`thrift_theme_draft_${storeId}`)
      setTimeout(() => setToast(null), 3000)
    },
    onError: () => {
      setToast({ message: 'Failed to save. Try again.', type: 'error' })
      setTimeout(() => setToast(null), 4000)
    },
  })

  if (!storeId) {
    return (
      <div className="p-8 text-center text-gray-400">
        <div className="flex justify-center mb-3"><Store size={40} className="text-gray-400" /></div>
        <p className="font-bold">Create a store first to customize it.</p>
        <Link href="/vendor/store" className="mt-4 inline-block text-brand-purple hover:underline font-bold">
          Go to My Store →
        </Link>
      </div>
    )
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'banner',     label: 'Banner' },
    { id: 'background', label: 'Background' },
    { id: 'vibes',      label: 'Vibes' },
    { id: 'typography', label: 'Typography' },
    { id: 'layout',     label: 'Layout' },
  ]

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {toast && <Toast message={toast.message} type={toast.type} />}

      {/* ── Left: Controls ─────────────────────────────────────────────────── */}
      <div className="w-80 flex-shrink-0 bg-white flex flex-col overflow-hidden" style={{ borderRight: '3px solid #1a0a3c' }}>
        {/* Header */}
        <div className="px-5 pt-5 pb-3 flex-shrink-0" style={{ borderBottom: '2px solid #1a0a3c' }}>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/vendor/store" className="flex items-center gap-1 text-gray-400 hover:text-gray-600 text-sm font-bold"><ArrowLeft size={14} /> Back</Link>
          </div>
          <h1 className="font-heading text-xl font-bold text-brand-purple uppercase tracking-wide">Customize Store</h1>
          <p className="text-xs text-gray-400 mt-0.5">Changes preview live →</p>
        </div>

        {/* Tab bar */}
        <div className="flex-shrink-0" style={{ borderBottom: '2px solid #1a0a3c' }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`w-full text-left px-5 py-2.5 text-sm font-bold border-l-4 transition-colors ${
                activeTab === t.id
                  ? 'border-brand-purple text-brand-purple bg-purple-50'
                  : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'banner'     && <BannerTab theme={theme} setTheme={setTheme} bannerFile={bannerFile} setBannerFile={setBannerFile} setBannerFileUrl={setBannerFileUrl} />}
          {activeTab === 'background' && <BackgroundTab theme={theme} setTheme={setTheme} />}
          {activeTab === 'vibes'      && <VibesTab theme={theme} setTheme={setTheme} />}
          {activeTab === 'typography' && <TypographyTab theme={theme} setTheme={setTheme} />}
          {activeTab === 'layout'     && <LayoutTab theme={theme} setTheme={setTheme} />}
        </div>

        {/* Save button */}
        <div className="flex-shrink-0 p-4 space-y-2" style={{ borderTop: '2px solid #1a0a3c' }}>
          {storeId && (
            <p className="text-xs text-gray-400 text-center">Draft auto-saved locally</p>
          )}
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="pixel-btn bg-brand-saffron text-white font-bold w-full py-3.5 text-sm disabled:opacity-60"
          >
            {saveMutation.isPending ? 'Saving…' : <span className="flex items-center justify-center gap-2"><Save size={16} /> Save Changes</span>}
          </button>
        </div>
      </div>

      {/* ── Right: Live preview ─────────────────────────────────────────────── */}
      <div className="flex-1 bg-gray-100 overflow-auto">
        <div className="p-6 min-h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Live Preview</p>
            {store && (
              <a
                href={`/stores/${store.id}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-brand-purple hover:underline font-bold"
              >
                View public page ↗
              </a>
            )}
          </div>
          <div className="max-w-lg mx-auto w-full">
            <StorePreview
              theme={theme}
              storeName={store?.name ?? 'My Store'}
              logoUrl={store?.logo ?? undefined}
              bannerFileUrl={bannerFileUrl ?? undefined}
              bannerRef={bannerRef as React.RefObject<HTMLDivElement>}
              onStickerMouseDown={handleStickerMouseDown}
              onBannerMouseMove={handleBannerMouseMove}
              onBannerMouseUp={handleBannerMouseUp}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
