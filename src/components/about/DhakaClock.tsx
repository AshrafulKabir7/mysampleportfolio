import { m } from "motion/react";
import { Moon, Sun } from "lucide-react";
import { profile } from "@/content/site";
import { useDhakaTime } from "@/lib/hooks";
import { EASE_OUT } from "@/components/primitives/Reveal";
import { TileHead } from "./Tile";

/** Live Dhaka clock with a hairline ring for how much of the day has gone by. */
export function DhakaClock() {
  const now = useDhakaTime();
  const minutes = now ? now.hour * 60 + Number(now.time.slice(3, 5)) : 0;
  const frac = minutes / 1440;
  const Icon = now?.isNight ? Moon : Sun;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-4">
        <TileHead title="Local time" />
        <span className="relative -mr-1 -mt-1 grid size-11 shrink-0 place-items-center" aria-hidden="true">
          <svg viewBox="0 0 48 48" className="absolute inset-0 size-full -rotate-90">
            <circle cx="24" cy="24" r="22" fill="none" stroke="var(--line-strong)" strokeWidth="1" />
            {now ? (
              <m.circle
                cx="24"
                cy="24"
                r="22"
                fill="none"
                stroke="var(--fg)"
                strokeWidth="1.5"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: frac }}
                transition={{ duration: 1.4, ease: EASE_OUT }}
              />
            ) : null}
          </svg>
          {now ? <Icon className="size-4 text-muted" strokeWidth={1.6} /> : null}
        </span>
      </div>
      <p className="tabular mt-auto pt-8 font-display text-[clamp(3.25rem,5.4vw,4.75rem)] font-semibold leading-[0.85] tracking-[-0.045em] text-fg">
        {now ? now.time : "--:--"}
      </p>
      <div className="mt-5 flex items-baseline justify-between gap-3 border-t pt-4">
        <span className="label-mono whitespace-nowrap text-muted">GMT+6 · Dhaka</span>
        <span lang="bn" className="font-bangla text-lg leading-none text-fg">
          {profile.bangla.city}
        </span>
      </div>
    </div>
  );
}
