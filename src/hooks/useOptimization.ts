"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchOptimization, isAbortError } from "@/lib/api-client";
import type { OptimizeResponse } from "@/lib/types";

export type Status = "idle" | "loading" | "success" | "error";

interface UseOptimizationResult {
  data: OptimizeResponse | null;
  status: Status;
  error: string | null;
  /** Re-run the optimization. Cancels any in-flight request first. */
  run: () => void;
}

/**
 * Owns the lifecycle of the /api/optimize request: cancellation on unmount or
 * re-run, error normalization, and status tracking. Runs once on mount.
 */
export function useOptimization(): UseOptimizationResult {
  const [data, setData] = useState<OptimizeResponse | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const run = useCallback(() => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setStatus("loading");
    setError(null);

    fetchOptimization({ signal: controller.signal })
      .then((result) => {
        if (controller.signal.aborted) return;
        setData(result);
        setStatus("success");
      })
      .catch((err: unknown) => {
        if (isAbortError(err) || controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Optimization failed.");
        setStatus("error");
      });
  }, []);

  useEffect(() => {
    run();
    return () => controllerRef.current?.abort();
  }, [run]);

  return { data, status, error, run };
}
