export default function Loading() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-4"
      role="status"
      aria-live="polite"
    >
      <svg
        className="h-10 w-10 animate-spin text-emerald-400 motion-reduce:animate-none"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
          className="opacity-25"
        />
        <path
          d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8z"
          fill="currentColor"
          className="opacity-75"
        />
      </svg>
      <p className="text-sm text-slate-400">Loading RouteGreen AI…</p>
    </div>
  );
}
