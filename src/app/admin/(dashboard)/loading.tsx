export default function AdminLoadingSkeleton() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Skeleton */}
      <div className="border-b border-border-color pb-6 space-y-3">
        <div className="h-3 w-40 bg-surface-color/80 rounded animate-pulse" />
        <div className="h-8 md:h-12 w-64 bg-surface-color/80 rounded animate-pulse" />
        <div className="h-4 w-96 max-w-full bg-surface-color/60 rounded animate-pulse" />
      </div>

      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-5 border border-border-color bg-surface-color/40 rounded-lg space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 bg-border-color/60 rounded animate-pulse" />
              <div className="h-6 w-6 bg-border-color/60 rounded-full animate-pulse" />
            </div>
            <div className="h-8 w-16 bg-border-color/80 rounded animate-pulse" />
            <div className="h-2 w-28 bg-border-color/40 rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Content Skeleton Table / Cards */}
      <div className="border border-border-color bg-surface-color/30 rounded-lg p-6 space-y-4">
        <div className="flex justify-between items-center mb-6">
          <div className="h-4 w-32 bg-border-color/70 rounded animate-pulse" />
          <div className="h-8 w-24 bg-border-color/50 rounded animate-pulse" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((row) => (
            <div
              key={row}
              className="h-12 w-full bg-surface-color/60 rounded border border-border-color/40 animate-pulse"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
