import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('animate-pulse rounded-md bg-gray-200', className)} />
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
      <Skeleton className="w-full aspect-[3/4]" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>
    </div>
  )
}

export function StoreCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
      <Skeleton className="w-full h-24" />
      <div className="px-4 pb-4">
        <div className="-mt-8 mb-3 flex items-end gap-3">
          <Skeleton className="w-16 h-16 rounded-full ring-4 ring-white flex-shrink-0" />
          <div className="flex-1 space-y-2 pb-1">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>
    </div>
  )
}
