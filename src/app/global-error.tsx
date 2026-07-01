"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#020617",
          color: "#e2e8f0",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "1.5rem",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>
          A critical error occurred
        </h1>
        <p style={{ marginTop: "0.75rem", color: "#94a3b8" }}>
          The application could not recover. Please reload the page.
        </p>
        <button
          onClick={reset}
          style={{
            marginTop: "2rem",
            borderRadius: "0.75rem",
            background: "#10b981",
            color: "#fff",
            border: "none",
            padding: "0.75rem 1.5rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Reload
        </button>
      </body>
    </html>
  );
}
