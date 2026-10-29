/**
 * Typed client for the RouteGreen internal API routes.
 *
 * Wraps `fetch` with:
 *  - request timeouts via AbortController (so a hung request never blocks the UI)
 *  - caller-supplied AbortSignal support (for React StrictMode / unmount cleanup)
 *  - normalized error handling through the `ApiError` type
 */

import type { OptimizeResponse, CargoItem } from "./types";
import type { AgentReport } from "./watsonx";

const DEFAULT_TIMEOUT_MS = 20_000;

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

interface RequestOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
}

interface OptimizationRequestOptions extends RequestOptions {
  cargo?: CargoItem[];
  gaParams?: {
    populationSize: number;
    generations: number;
    mutationRate: number;
  };
}

/** Merge a caller signal with an internal timeout signal. */
function withTimeout(
  external: AbortSignal | undefined,
  timeoutMs: number,
): { signal: AbortSignal; cleanup: () => void } {
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(new DOMException("Request timed out", "TimeoutError")),
    timeoutMs,
  );

  const onExternalAbort = () => controller.abort(external?.reason);
  if (external) {
    if (external.aborted) controller.abort(external.reason);
    else external.addEventListener("abort", onExternalAbort, { once: true });
  }

  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timer);
      external?.removeEventListener("abort", onExternalAbort);
    },
  };
}

async function request<T>(
  path: string,
  method: 'GET' | 'POST' = 'GET',
  body?: unknown,
  { signal, timeoutMs = DEFAULT_TIMEOUT_MS }: RequestOptions = {},
): Promise<T> {
  const { signal: mergedSignal, cleanup } = withTimeout(signal, timeoutMs);

  try {
    const res = await fetch(path, {
      method,
      headers: { 
        Accept: "application/json",
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      signal: mergedSignal,
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    if (!res.ok) {
      throw new ApiError(
        `Request to ${path} failed with status ${res.status}`,
        res.status,
      );
    }

    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err instanceof DOMException && err.name === "TimeoutError") {
      throw new ApiError("The request took too long. Please try again.", 408);
    }
    // AbortError (component unmount / caller cancel) is re-thrown for the caller
    // to ignore; anything else is surfaced as a generic network error.
    if (err instanceof DOMException && err.name === "AbortError") {
      throw err;
    }
    throw new ApiError(
      err instanceof Error ? err.message : "Network request failed",
      0,
    );
  } finally {
    cleanup();
  }
}

export function fetchOptimization(
  options?: OptimizationRequestOptions,
): Promise<OptimizeResponse> {
  const { cargo, gaParams, ...requestOptions } = options || {};
  
  if (cargo || gaParams) {
    return request<OptimizeResponse>("/api/optimize", 'POST', { cargo, gaParams }, requestOptions);
  }
  
  return request<OptimizeResponse>("/api/optimize", 'GET', undefined, requestOptions);
}

export function fetchReport(
  options?: RequestOptions,
): Promise<{ report: AgentReport }> {
  return request<{ report: AgentReport }>("/api/report", 'GET', undefined, options);
}

/** True when an error represents a caller/unmount cancellation we can ignore. */
export function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError";
}
