import { cn } from "@/lib/cn";

/** All project screenshots in src/assets/work are 1440 × 900 */
export const SHOT_W = 1440;
export const SHOT_H = 900;

export const pad = (n: number) => String(n).padStart(2, "0");

/** "https://tallycam.vercel.app/x" → "tallycam.vercel.app" (pure, SSR-safe) */
export function hostOf(url: string): string {
  try {
    const u = new URL(url);
    return u.host === "github.com" ? `github.com${u.pathname}` : u.host;
  } catch {
    return url;
  }
}

/** Tiny neutral check mark for proof bullets (red stays reserved for interaction and the signal) */
export function CheckMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 12" aria-hidden="true" focusable="false" className={cn("text-muted", className)}>
      <path
        d="M2.25 6.4 4.9 9 9.75 3.25"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
