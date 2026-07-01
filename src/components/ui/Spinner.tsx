interface SpinnerProps {
  className?: string;
}

/** Accessible loading spinner; respects prefers-reduced-motion. */
export function Spinner({ className = "h-5 w-5" }: SpinnerProps) {
  return (
    <svg
      className={`animate-spin motion-reduce:animate-none ${className}`}
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
  );
}
