"use client";

import { useEffect } from "react";

/**
 * Adds a `visible` class to every `.reveal` element as it scrolls into view.
 * Re-runs whenever `trigger` changes so newly-rendered content (e.g. dashboard
 * results) is observed too. Elements are revealed immediately when the
 * IntersectionObserver API is unavailable.
 */
export function useScrollReveal(trigger?: unknown): void {
  useEffect(() => {
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>(".reveal:not(.visible)"),
    );
    if (elements.length === 0) return;

    if (typeof IntersectionObserver === "undefined") {
      elements.forEach((el) => el.classList.add("visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [trigger]);
}
