"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Landing-page AI demo. Illustrative only — no AI call. Every "after" keeps exactly the facts of its
 * "before" (the app's honesty rule: reword, never invent). Starts when scrolled into view; with
 * reduced motion everything is shown finished and still.
 */
const REWRITES = [
  {
    before: "Fixed printers and computers for about 120 employees",
    after: "Resolved printer and computer issues for about 120 employees",
  },
  {
    before: "In charge of encoding delivery records in Excel",
    after: "Encoded and checked delivery records in MS Excel",
  },
  {
    before: "Was responsible for planning our org's events",
    after: "Planned and ran our student organization's events",
  },
];

const KEYWORDS: { word: string; found: boolean }[] = [
  { word: "Windows troubleshooting", found: true },
  { word: "Customer service", found: true },
  { word: "MS Excel", found: true },
  { word: "Ticketing system", found: true },
  { word: "Active Directory", found: false },
  { word: "Shifting schedule", found: false },
];
const MATCH = 67;

/** When the element first scrolls into view: { on, still } — still = the visitor asked for reduced motion. */
function useInView<T extends Element>() {
  const ref = useRef<T>(null);
  const [view, setView] = useState({ on: false, still: false });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // The finished example is the default (no JS / reduced motion / before hydration). Only when
    // motion is allowed do we hide it ("armed") until it scrolls in and plays.
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) el.classList.add("armed");
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setView({
          on: true,
          still: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        });
        io.disconnect();
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, view] as const;
}

function Sparkle({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`sparkle ${className}`} aria-hidden="true">
      <path
        d="M12 2c.6 4.6 2.4 6.4 7 7-4.6.6-6.4 2.4-7 7-.6-4.6-2.4-6.4-7-7 4.6-.6 6.4-2.4 7-7Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Card 1: a weak bullet rewrites itself, letter by letter, then moves on to the next example. */
function RewriteCard() {
  const [ref, { on, still }] = useInView<HTMLDivElement>();
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState(0);

  useEffect(() => {
    if (!on || still) return;
    const full = REWRITES[index].after.length;
    const timer =
      typed < full
        ? setTimeout(() => setTyped((t) => t + 1), 32)
        : setTimeout(() => {
            setTyped(0);
            setIndex((i) => (i + 1) % REWRITES.length);
          }, 2600);
    return () => clearTimeout(timer);
  }, [on, still, index, typed]);

  const ex = REWRITES[index];
  const animating = on && !still;
  const shown = animating ? ex.after.slice(0, typed) : ex.after;
  const done = !animating || typed >= ex.after.length;

  return (
    <div
      ref={ref}
      className={`relative rounded-2xl border border-border/40 bg-white p-5 shadow-[0_18px_40px_-28px_rgb(30_58_138/0.6)] sm:p-6 ${on ? "is-on" : ""}`}
    >
      <p className="text-xs font-bold tracking-[0.14em] text-muted">YOUR BULLET</p>
      <p className="mt-2 text-muted line-through decoration-slate-300">{ex.before}</p>

      <div className="my-4 flex items-center gap-2 text-sm font-semibold text-primary">
        <Sparkle className="size-5 text-primary" />
        Improve with AI
        <span className="h-px flex-1 bg-gradient-to-r from-primary/40 to-transparent" />
      </div>

      <p className="text-xs font-bold tracking-[0.14em] text-primary">SUGGESTION</p>
      <p className="typed mt-2 min-h-[3.5rem] text-lg font-medium" aria-live="off">
        {shown}
        {!done && <span className="caret" aria-hidden="true" />}
      </p>
      <p
        className={`mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary transition-opacity duration-300 ${done ? "opacity-100" : "opacity-0"}`}
      >
        ✓ Same facts, stronger words
      </p>
      <span className="sr-only">
        Example: “{ex.before}” becomes “{ex.after}”.
      </span>
    </div>
  );
}

/** Card 2: paste a job post → keywords found / missing → match score counts up. */
function TailorCard() {
  const [ref, { on, still }] = useInView<HTMLDivElement>();
  const [count, setCount] = useState(0);
  const score = on && !still ? count : MATCH;

  useEffect(() => {
    if (!on || still) return;
    let n = 0;
    const timer = setInterval(() => {
      n += 1;
      setCount(n);
      if (n >= MATCH) clearInterval(timer);
    }, 18);
    return () => clearInterval(timer);
  }, [on, still]);

  return (
    <div
      ref={ref}
      className={`relative rounded-2xl border border-border/40 bg-white p-5 shadow-[0_18px_40px_-28px_rgb(30_58_138/0.6)] sm:p-6 ${on ? "is-on" : ""}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-[0.14em] text-muted">JOB POST</p>
          <p className="mt-1 font-semibold">IT Support Associate · Quezon City</p>
        </div>
        <div className="typed text-right">
          <p className="font-[family-name:var(--font-bricolage)] text-3xl leading-none font-extrabold text-primary tabular-nums">
            {score}%
          </p>
          <p className="mt-1 text-xs text-muted">keyword match</p>
        </div>
      </div>
      <div className="typed mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-sky-500 transition-[width] duration-300"
          style={{ width: `${score}%` }}
        />
      </div>

      <ul className="mt-5 flex flex-wrap gap-2" aria-label="Keywords from the job post">
        {KEYWORDS.map((k, i) => (
          <li
            key={k.word}
            className={`chip rounded-full px-3 py-1 text-sm font-medium ${k.found ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"}`}
            style={{ "--i": i } as React.CSSProperties}
          >
            {k.found ? "✓" : "＋"} {k.word}
            <span className="sr-only">{k.found ? " (already in your resume)" : " (missing)"}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm text-muted">
        Missing something you really have? Add it. Don&apos;t have it? We&apos;ll never put it in
        for you.
      </p>
    </div>
  );
}

export function AiDemo() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <RewriteCard />
      <TailorCard />
    </div>
  );
}
