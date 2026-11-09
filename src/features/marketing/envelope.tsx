/**
 * Hero illustration: a resume sliding out of a long brown envelope, 2x2 photo clipped on —
 * the way Filipinos hand in job requirements. Pure HTML/CSS (no image to download); decorative,
 * so hidden from screen readers. The motion lives in globals.css and respects reduced motion.
 */
function Bar({ w, tone = "bg-slate-200" }: { w: string; tone?: string }) {
  return <div className={`h-1.5 rounded-full ${tone}`} style={{ width: w }} />;
}

function Heading({ children }: { children: string }) {
  return (
    <p className="mt-3 border-b border-primary/40 pb-0.5 text-[7px] font-bold tracking-[0.12em] text-primary sm:text-[8px]">
      {children}
    </p>
  );
}

/** Little AI sparkles next to the highlighted (improved) line. */
function TwinkleStar({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`sparkle absolute text-primary ${className}`}>
      <path
        d="M12 2c.6 4.6 2.4 6.4 7 7-4.6.6-6.4 2.4-7 7-.6-4.6-2.4-6.4-7-7 4.6-.6 6.4-2.4 7-7Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function EnvelopeHero() {
  return (
    <div
      aria-hidden="true"
      className="relative mx-auto aspect-[3/4] w-full max-w-[19rem] sm:max-w-[22rem]"
      // Clip only the bottom edge: the part of the resume still inside the envelope stays hidden.
      style={{ clipPath: "inset(-40% -40% 0 -40%)" }}
    >
      {/* Back of the envelope, flap open behind */}
      <div
        className="absolute inset-x-[6%] bottom-[66%] h-[16%] bg-kraft-dark"
        style={{ clipPath: "polygon(0 100%, 12% 0, 88% 0, 100% 100%)" }}
      />
      <div className="absolute inset-x-[6%] bottom-0 h-[68%] rounded-b-md bg-kraft-dark" />

      {/* The resume, sliding up out of the envelope */}
      <div className="anim-slide-out absolute inset-x-[11%] top-[3%] h-[80%] rounded-sm bg-white px-[7%] pt-[7%] shadow-[0_10px_30px_-12px_rgb(15_23_42/0.45)]">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-[family-name:var(--font-bricolage)] text-[13px] leading-tight font-bold text-primary sm:text-[15px]">
              Juan Dela Cruz
            </p>
            <p className="mt-0.5 text-[7px] text-muted sm:text-[8px]">BS Information Technology</p>
            <div className="mt-1.5 space-y-1">
              <Bar w="80%" />
              <Bar w="55%" />
            </div>
          </div>
          {/* 2x2 photo with a paperclip */}
          <div className="anim-clip-on relative -mt-1 w-[26%] shrink-0 rotate-[-4deg]">
            <div className="aspect-square rounded-[2px] border-[3px] border-white bg-gradient-to-b from-sky-200 to-sky-300 shadow-md">
              <svg viewBox="0 0 40 40" className="h-full w-full">
                <circle cx="20" cy="16" r="7.5" fill="#64748b" />
                <path d="M6 40c1.5-9 7.5-13.5 14-13.5S32.5 31 34 40Z" fill="#475569" />
              </svg>
            </div>
            <svg
              viewBox="0 0 12 28"
              className="absolute -top-3 left-1/2 h-7 w-3 -translate-x-1/2"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="1.6"
              strokeLinecap="round"
            >
              <path d="M3 24V6a3 3 0 0 1 6 0v17a1.8 1.8 0 0 1-3.6 0V8" />
            </svg>
          </div>
        </div>

        <Heading>EDUCATION</Heading>
        <div className="mt-1.5 space-y-1">
          <Bar w="70%" tone="bg-slate-300" />
          <Bar w="50%" />
        </div>
        <Heading>INTERNSHIP (OJT)</Heading>
        <div className="mt-1.5 space-y-1">
          <Bar w="62%" tone="bg-slate-300" />
          <Bar w="88%" />
          <div className="relative">
            <Bar w="76%" tone="bg-highlight" />
            <TwinkleStar className="-top-2.5 left-[78%] size-3.5" />
            <TwinkleStar className="sparkle-delay -top-4 left-[86%] size-2.5" />
          </div>
          <Bar w="68%" />
        </div>
        <Heading>SKILLS</Heading>
        <div className="mt-1.5 space-y-1">
          <Bar w="84%" />
        </div>
      </div>

      {/* Front pocket with the handwritten label and string-and-button closure */}
      <div className="absolute inset-x-[6%] bottom-0 h-[44%] rounded-b-md bg-kraft shadow-[inset_0_8px_10px_-8px_rgb(0_0_0/0.25)]">
        <svg viewBox="0 0 40 24" className="absolute -top-2 left-1/2 h-6 w-10 -translate-x-1/2">
          <path
            d="M20 8 C 12 14, 28 16, 18 22"
            fill="none"
            stroke="#7a5a30"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <circle cx="20" cy="8" r="5" fill="#8b6a3e" stroke="#6b4f2a" strokeWidth="1" />
        </svg>
        <div className="absolute inset-x-[14%] top-[34%] rotate-[-2deg] rounded-sm bg-white/95 px-3 py-2 shadow-sm">
          <p className="font-[family-name:var(--font-bricolage)] text-[12px] leading-tight font-semibold text-primary sm:text-[14px]">
            Juan Dela Cruz
          </p>
          <p className="mt-0.5 text-[9px] text-primary/80 sm:text-[10px]">
            Applying for: IT Support Associate
          </p>
        </div>
      </div>
    </div>
  );
}
