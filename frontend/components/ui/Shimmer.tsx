import { cn } from '@/lib/utils'

interface ShimmerProps {
  className?: string
}

export function Shimmer({ className }: ShimmerProps) {
  return <div className={cn('shimmer', className)} />
}
