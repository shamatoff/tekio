import { Card } from '../ui/Card'
import { Skeleton } from '../ui/Skeleton'

export function HomeSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl p-4 bg-surface border border-border">
        <Skeleton className="h-3 w-32 mb-2" />
        <Skeleton className="h-4 w-48 mb-2" />
        <Skeleton className="h-3 w-40" />
      </div>

      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="bg-surface rounded-xl border border-border py-2.5 px-1.5">
            <Skeleton className="h-5 w-5 mx-auto mb-1.5" />
            <Skeleton className="h-4 w-6 mx-auto mb-1" />
            <Skeleton className="h-2.5 w-10 mx-auto" />
          </div>
        ))}
      </div>

      {Array.from({ length: 3 }, (_, i) => (
        <Card key={i}>
          <Skeleton className="h-3 w-20 mb-3" />
          <Skeleton className="h-6 w-24 mb-3" />
          <Skeleton className="h-12 w-full" />
        </Card>
      ))}
    </div>
  )
}
