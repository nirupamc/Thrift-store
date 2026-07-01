import { cn } from '@/lib/utils'
import { Shimmer } from './Shimmer'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return <Shimmer className={cn('rounded-md', className)} />
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
      <Shimmer className="w-full aspect-[3/4]" />
      <div className="p-4 space-y-2">
        <Shimmer className="h-4 w-3/4 rounded" />
        <Shimmer className="h-4 w-1/2 rounded" />
        <div className="flex gap-2 pt-1">
          <Shimmer className="h-5 w-16 rounded-full" />
          <Shimmer className="h-5 w-16 rounded-full" />
        </div>
      </div>
    </div>
  )
}

export function StoreCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
      <Shimmer className="w-full h-24" />
      <div className="px-4 pb-4">
        <div className="-mt-8 mb-3 flex items-end gap-3">
          <Shimmer className="w-16 h-16 rounded-full ring-4 ring-white flex-shrink-0" />
          <div className="flex-1 space-y-2 pb-1">
            <Shimmer className="h-4 w-2/3 rounded" />
            <Shimmer className="h-3 w-1/3 rounded" />
          </div>
        </div>
        <div className="flex gap-2">
          <Shimmer className="h-5 w-16 rounded-full" />
          <Shimmer className="h-5 w-16 rounded-full" />
        </div>
      </div>
    </div>
  )
}
