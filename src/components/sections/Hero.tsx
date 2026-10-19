import { m, useScroll, useTransform } from "motion/react";
import { ArrowDown, Check, Copy } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { path, profile } from "@/content/site";
import { Button, ButtonLink, LiveDot } from "@/components/primitives/Bits";
import { SignalCanvas } from "@/components/hero/SignalCanvas";
import { HeroName } from "@/components/hero/HeroName";
import { Thesis } from "@/components/hero/Thesis";
import { copyText, useDhakaTime, useReducedMotionPref } from "@/lib/hooks";
import { useIntroDone } from "@/lib/intro";
import { scrollToId } from "@/lib/scroll";
import { cn } from "@/lib/cn";
import "@/components/hero/hero.css";

const work = path.find((p) => p.kind === "work");
const study = path.find((p) => p.kind === "education");

function jump(id: string) {
  return (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    scrollToId(id);
  };
}

/**
 * CSS entrance (index.css): `.hero-in` fades + rises, `.hero-rise` only rises
 * (LCP text paints at once). Static class + style, identical on server and
 * client; paused under the intro curtain, played the moment it lifts.
 */
const enter = (delay: number, y?: number): CSSProperties =>
  ({ "--hd": `${delay}s`, ...(y === undefined ? null : { "--hy": `${y}px` }) }) as CSSProperties;

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  // starts the coronagraph field once the intro curtain starts lifting (or at once)
  const ready = useIntroDone();
  const reduce = useReducedMotionPref();
  const clock = useDhakaTime();

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0.2]);
  const canvasScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);

  return (
    <section
      ref={ref}
      id="top"
      aria-label="Introduction"
      className="relative isolate flex min-h-[100svh] flex-col overflow-hidden"
    >
      <m.div
        className="absolute inset-0 -z-10 origin-[72%_40%]"
        // explicit final values: motion never clears a value it was given during hydration
        style={reduce ? { scale: 1 } : { scale: canvasScale }}
      >
        <SignalCanvas ready={ready} textRef={textRef} />
      </m.div>

      <m.div
        ref={textRef}
        style={reduce ? { y: 0, opacity: 1 } : { y: contentY, opacity: contentOpacity }}
        className={cn(
          "container-page relative z-10 flex flex-1 flex-col pb-8 pt-24",
          "md:pb-14 md:pt-32 md:portrait:justify-end md:portrait:pb-16",
          "lg:pb-[clamp(1.5rem,4svh,2.75rem)] lg:pt-[clamp(6rem,12.5svh,6.5rem)]",
        )}
      >
        <div className="hero-in flex items-start justify-between gap-6" style={enter(0, 8)}>
          <p
            data-field-hole=""
            className="label-mono flex items-start gap-3 text-[0.66rem] leading-relaxed text-fg md:items-center md:text-[0.72rem]"
          >
            <LiveDot className="mt-[0.42em] md:mt-0" />
            <span className="max-md:max-w-[14rem]">{profile.status}</span>
          </p>
          <p data-field-hole="" className="label-mono hidden shrink-0 text-muted md:block">
            {profile.coords} · {profile.location}
          </p>
        </div>

        <HeroName className="mt-7 md:mt-12 lg:mt-[clamp(1rem,3.6svh,2rem)]" />

        <div className="mt-6 grid md:mt-10 lg:mt-[clamp(1rem,3svh,1.75rem)] lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Thesis text={profile.thesis} delay={0.42} className="max-w-[24ch] text-balance lg:max-w-[34ch]" />
            <p
              data-text-edge=""
              className="hero-rise text-lede mt-5 max-w-[46ch] text-muted max-md:text-[1.05rem] md:mt-6 lg:mt-[clamp(1rem,2.6svh,1.5rem)] lg:text-[1.28rem]"
              style={enter(0.56)}
            >
              {profile.lede}
            </p>
            <div
              className="hero-in mt-7 flex flex-wrap items-center gap-3 md:mt-8 lg:mt-[clamp(1.25rem,3.4svh,2rem)]"
              style={enter(0.68)}
            >
              <ButtonLink
                href="#research"
                magnetic
                onClick={jump("research")}
                icon={
                  <ArrowDown
                    aria-hidden="true"
                    className="size-4 transition-transform duration-300 group-hover:translate-y-0.5"
                  />
                }
              >
                Explore the research
              </ButtonLink>
              <ButtonLink href="#builds" variant="outline" onClick={jump("builds")}>
                Selected builds
              </ButtonLink>
              <ButtonLink href={profile.links.cv} variant="ghost">
                CV
              </ButtonLink>
              <CopyEmail />
            </div>
          </div>
        </div>

        <p
          aria-hidden="true"
          data-field-hole=""
          className="hero-in label-mono pointer-events-none absolute bottom-[clamp(1.5rem,4svh,2.75rem)] right-[clamp(16px,4vw,48px)] hidden text-right text-[0.62rem] leading-[1.7] text-muted lg:block"
          style={enter(1.1, 0)}
        >
          Fig. 00 — Simulated coronagraph frame
          <br />
          Star masked · faint companion recovered
        </p>
      </m.div>

      <div className="hero-in relative z-10 border-t border-line" style={enter(0.85, 0)}>
        <div className="container-page grid grid-cols-2 lg:grid-cols-4">
          <Fact label="Studying" className="lg:pl-0">
            MSc CSE · {study?.org ?? "BRAC University"}
          </Fact>
          <Fact label="Building" className="border-l border-line pl-4 lg:pl-5">
            AI @ {work?.org ?? "Shahriar Labs"}
          </Fact>
          <Fact label="Local time" className="border-t border-line lg:border-l lg:border-t-0 lg:pl-5">
            Dhaka <span className="tabular text-fg">{clock?.time ?? "--:--"}</span> GMT+6
          </Fact>
          <div className="flex items-center justify-end border-l border-t border-line py-4 pl-4 md:py-5 lg:border-t-0 lg:py-[clamp(0.85rem,2.4svh,1.25rem)]">
            <a
              href="#research"
              onClick={jump("research")}
              className="label-mono group flex items-center gap-3 text-muted transition-colors duration-300 hover:text-fg"
            >
              Scroll
              <span aria-hidden="true" className="relative block h-px w-12 overflow-hidden bg-line-strong">
                {/* compositor-only loop (index.css .cue); still under reduced or paused motion */}
                <span className="cue absolute inset-y-0 left-0 block w-1/2 bg-fg" />
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function Fact({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div className={cn("py-4 pr-3 md:py-5 lg:py-[clamp(0.85rem,2.4svh,1.25rem)]", className)}>
      <p className="label-mono text-[0.62rem] text-muted md:text-[0.66rem]">{label}</p>
      <p className="label-mono mt-1.5 text-[0.64rem] leading-snug text-fg md:text-[0.72rem]">{children}</p>
    </div>
  );
}

function CopyEmail() {
  const [copied, setCopied] = useState(false);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <Button
      variant="outline"
      aria-label="Copy email address"
      title="Copy email"
      className="w-12 justify-center gap-0 px-0"
      onClick={async () => {
        const ok = await copyText(profile.email);
        if (!ok) {
          toast("Couldn’t reach the clipboard", { description: profile.email });
          return;
        }
        toast("Email copied");
        setCopied(true);
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setCopied(false), 2000);
      }}
      icon={
        <span className="relative block size-4" aria-hidden="true">
          <Copy
            className={cn(
              "absolute inset-0 size-4 transition-[opacity,scale] duration-300",
              copied ? "scale-50 opacity-0" : "scale-100 opacity-100",
            )}
          />
          <Check
            className={cn(
              "absolute inset-0 size-4 text-fg transition-[opacity,scale] duration-300",
              copied ? "scale-100 opacity-100" : "scale-50 opacity-0",
            )}
          />
        </span>
      }
    />
  );
}
