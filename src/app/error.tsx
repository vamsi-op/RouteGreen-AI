"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface to the console; wire to a real monitoring service in production.
    console.error("Unhandled application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-wider text-emerald-400">
        Something went wrong
      </p>
      <h1 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
        The dashboard hit an unexpected error
      </h1>
      <p className="mt-3 max-w-md text-sm text-slate-400">
        This has been logged. You can try again — the optimization runs on a
        deterministic local dataset, so a retry usually resolves transient
        issues.
      </p>
      <button
        onClick={reset}
        className="mt-8 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-400"
      >
        Try again
      </button>
    </div>
  );
}
