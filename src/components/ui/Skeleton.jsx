function Skeleton({ className = '' }) {
  return <div className={`skeleton rounded ${className}`} />
}

function SkeletonCircle({ size = 40, className = '' }) {
  return <div className={`skeleton rounded-full shrink-0 ${className}`} style={{ width: size, height: size }} />
}

function SkeletonCard({ imageAspect = 'aspect-[4/3]', lines = 3, hasButton = true, className = '' }) {
  return (
    <div className={`rounded-2xl overflow-hidden bg-[#0F1D13] border border-white/[0.08] ${className}`}>
      <div className={`${imageAspect} skeleton`} />
      <div className="p-4 flex flex-col gap-2.5">
        {lines >= 1 && <div className="h-2.5 w-16 rounded skeleton" />}
        {lines >= 2 && <div className="h-3.5 w-3/4 rounded skeleton" />}
        {lines >= 3 && <div className="h-4 w-20 rounded skeleton mt-1" />}
        {hasButton && <div className="h-9 w-full rounded-xl skeleton mt-1" />}
      </div>
    </div>
  )
}

function SkeletonRow({ className = '' }) {
  return (
    <div className={`flex items-center justify-between px-5 sm:px-6 py-4 ${className}`}>
      <div className="space-y-2">
        <div className="h-4 skeleton rounded w-32" />
        <div className="h-3 skeleton rounded w-20" />
      </div>
      <div className="flex items-center gap-4">
        <div className="space-y-2 text-right">
          <div className="h-3 skeleton rounded w-16" />
          <div className="h-4 skeleton rounded w-24" />
        </div>
        <div className="w-8 h-8 skeleton rounded-lg" />
      </div>
    </div>
  )
}

function SkeletonTable({ rows = 4, cols = 3, className = '' }) {
  return (
    <div className={`rounded-xl border border-white/[0.08] bg-white/[0.04] p-6 ${className}`}>
      <div className="flex gap-4 mb-6">
        <div className="w-20 h-20 skeleton rounded-lg" />
        {Array.from({ length: cols - 1 }).map((_, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-16 h-16 skeleton rounded-lg" />
            <div className="h-3 skeleton rounded w-20" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="h-3 skeleton rounded w-24" />
            {Array.from({ length: cols }).map((_, j) => (
              <div key={j} className="flex-1 h-3 skeleton rounded" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export { Skeleton, SkeletonCircle, SkeletonCard, SkeletonRow, SkeletonTable }
