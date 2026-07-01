// Scroll reveals + animated counters — pure IntersectionObserver + CSS classes.
// No external dependency and no inline styles, so reveals are reliable and the
// HTML failsafe can always take over.

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function reveal(el) {
  el.classList.add("is-visible");
}

function animateCounter(el) {
  const target = parseFloat(el.dataset.target || "0");
  const decimals = parseInt(el.dataset.decimals || "0", 10);
  if (reduceMotion) {
    el.textContent = target.toFixed(decimals);
    return;
  }
  const duration = 1500;
  const start = performance.now();
  const step = (now) => {
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = (eased * target).toFixed(decimals);
    if (p < 1) requestAnimationFrame(step);
    else el.textContent = target.toFixed(decimals);
  };
  requestAnimationFrame(step);
}

function fillStat(card) {
  const bar = card.querySelector(".bar");
  if (bar) bar.classList.add("filled");
  const counter = card.querySelector(".counter");
  if (counter) animateCounter(counter);
}

export function initAnimations() {
  const revealEls = Array.from(document.querySelectorAll("[data-anim]"));
  const statCards = Array.from(document.querySelectorAll(".card.stat"));

  // If reduced motion or IO unsupported, just show everything immediately.
  if (reduceMotion || typeof IntersectionObserver === "undefined") {
    revealEls.forEach(reveal);
    statCards.forEach(fillStat);
    return;
  }

  const revealIO = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          reveal(e.target);
          obs.unobserve(e.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -8% 0px" }
  );
  revealEls.forEach((el) => revealIO.observe(el));

  const statIO = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          fillStat(e.target);
          obs.unobserve(e.target);
        }
      });
    },
    { threshold: 0.35 }
  );
  statCards.forEach((c) => statIO.observe(c));

  // Belt-and-braces: anything still hidden after 1.8s is force-revealed.
  setTimeout(() => revealEls.forEach(reveal), 1800);
}
