import { cn } from '@/lib/utils'
import { formatCondition, formatRarity } from '@/lib/utils'
import type { ProductCondition, ProductRarity } from '@/lib/types'
import { Diamond } from 'lucide-react'

const rarityStyles: Record<ProductRarity, string> = {
  VINTAGE_RARE: 'bg-amber-100 text-amber-800 border border-amber-300',
  RARE:         'bg-purple-100 text-purple-800 border border-purple-300',
  UNCOMMON:     'bg-blue-100 text-blue-800 border border-blue-300',
  COMMON:       'bg-gray-100 text-gray-600 border border-gray-300',
}

const conditionStyles: Record<ProductCondition, string> = {
  NEW_WITH_TAGS: 'bg-green-100 text-green-800',
  LIKE_NEW:      'bg-emerald-100 text-emerald-800',
  GOOD:          'bg-yellow-100 text-yellow-800',
  FAIR:          'bg-orange-100 text-orange-800',
}

interface BadgeProps {
  className?: string
  children: React.ReactNode
}

export function Badge({ className, children }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', className)}>
      {children}
    </span>
  )
}

export function RarityBadge({ rarity }: { rarity: ProductRarity }) {
  return (
    <Badge className={rarityStyles[rarity]}>
      {rarity === 'VINTAGE_RARE' && <Diamond size={10} className="inline mr-1" />}
      {formatRarity(rarity)}
    </Badge>
  )
}

export function ConditionBadge({ condition }: { condition: ProductCondition }) {
  return (
    <Badge className={conditionStyles[condition]}>
      {formatCondition(condition)}
    </Badge>
  )
}
