/** Animated placeholder shown while the analysis request is in flight. */
export default function ResultsSkeleton() {
  return (
    <section className="mt-10 animate-pulse space-y-8" aria-hidden="true">
      <div className="flex flex-col items-center gap-5 rounded-xl border border-zinc-200 p-6 sm:flex-row dark:border-zinc-800">
        <div className="h-28 w-28 shrink-0 rounded-full bg-zinc-200 dark:bg-zinc-800" />
        <div className="w-full space-y-2">
          <div className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-3 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {[0, 1].map((col) => (
          <div
            key={col}
            className="space-y-3 rounded-xl border border-zinc-200 p-5 dark:border-zinc-800"
          >
            <div className="h-3 w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="flex flex-wrap gap-2">
              {[10, 16, 12, 14].map((w, i) => (
                <div
                  key={i}
                  className="h-6 rounded-full bg-zinc-200 dark:bg-zinc-800"
                  style={{ width: `${w * 6}px` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <div className="h-4 w-40 rounded bg-zinc-200 dark:bg-zinc-800" />
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-14 rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"
          />
        ))}
      </div>
    </section>
  );
}
