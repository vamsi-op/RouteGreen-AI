"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchReport, isAbortError } from "@/lib/api-client";
import type { AgentReport } from "@/lib/watsonx";
import type { Status } from "./useOptimization";

interface UseReportResult {
  report: AgentReport | null;
  status: Status;
  error: string | null;
  generate: () => void;
  reset: () => void;
}

/**
 * Owns the /api/report (IBM Granite multi-agent) request lifecycle, mirroring
 * useOptimization. `reset` clears the report when the underlying optimization
 * is re-run so stale ESG summaries are never shown.
 */
export function useReport(): UseReportResult {
  const [report, setReport] = useState<AgentReport | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const generate = useCallback(() => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setStatus("loading");
    setError(null);

    fetchReport({ signal: controller.signal, timeoutMs: 30_000 })
      .then(({ report: result }) => {
        if (controller.signal.aborted) return;
        setReport(result);
        setStatus("success");
      })
      .catch((err: unknown) => {
        if (isAbortError(err) || controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Report generation failed.");
        setStatus("error");
      });
  }, []);

  const reset = useCallback(() => {
    controllerRef.current?.abort();
    setReport(null);
    setStatus("idle");
    setError(null);
  }, []);

  useEffect(() => () => controllerRef.current?.abort(), []);

  return { report, status, error, generate, reset };
}
