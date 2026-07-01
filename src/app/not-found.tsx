import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="gradient-text text-6xl font-black">404</p>
      <h1 className="mt-4 text-2xl font-bold text-white sm:text-3xl">
        This page took a wrong turn
      </h1>
      <p className="mt-3 max-w-md text-sm text-slate-400">
        The route you requested doesn&apos;t exist. Let&apos;s get you back on
        the optimized path.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-400"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
