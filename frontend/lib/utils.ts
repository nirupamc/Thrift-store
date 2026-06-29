import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatCondition(condition: string): string {
  const map: Record<string, string> = {
    NEW_WITH_TAGS: 'New with Tags',
    LIKE_NEW: 'Like New',
    GOOD: 'Good',
    FAIR: 'Fair',
  }
  return map[condition] ?? condition
}

export function formatRarity(rarity: string): string {
  const map: Record<string, string> = {
    VINTAGE_RARE: 'Vintage Rare',
    RARE: 'Rare',
    UNCOMMON: 'Uncommon',
    COMMON: 'Common',
  }
  return map[rarity] ?? rarity
}
