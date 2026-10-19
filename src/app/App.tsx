import { LazyMotion, MotionConfig } from "motion/react";
import { Toaster } from "sonner";
import { SmoothScroll } from "@/components/chrome/SmoothScroll";
import { Intro } from "@/components/chrome/Intro";
import { Nav } from "@/components/chrome/Nav";
import { CommandPalette } from "@/components/chrome/CommandPalette";
import { CursorLabel } from "@/components/chrome/CursorLabel";
import { Footer } from "@/components/chrome/Footer";
import { Hero } from "@/components/sections/Hero";
import { FocusTicker } from "@/components/sections/FocusTicker";
import { Research } from "@/components/sections/Research";
import { Builds } from "@/components/sections/Builds";
import { Papers } from "@/components/sections/Papers";
import { Path } from "@/components/sections/Path";
import { About } from "@/components/sections/About";
import { Contact } from "@/components/sections/Contact";

// <m.*> components render their initial styles without features, so the prerender is
// unchanged; animations start once this chunk arrives (right after hydration).
const loadMotionFeatures = () => import("./motion-features").then((r) => r.default);

const SECTIONS = {
  hero: Hero,
  ticker: FocusTicker,
  research: Research,
  builds: Builds,
  papers: Papers,
  path: Path,
  about: About,
  contact: Contact,
} as const;

type SectionKey = keyof typeof SECTIONS;

/**
 * Dev-only isolation: /?only=research renders one section (plus chrome) so
 * section builders can screenshot their work in isolation.
 */
function onlySection(): SectionKey | null {
  if (!import.meta.env.DEV || typeof window === "undefined") return null;
  const v = new URLSearchParams(window.location.search).get("only");
  return v && v in SECTIONS ? (v as SectionKey) : null;
}

export default function App() {
  const only = onlySection();
  const keys = only ? [only] : (Object.keys(SECTIONS) as SectionKey[]);

  return (
    <LazyMotion features={loadMotionFeatures} strict>
      <MotionConfig reducedMotion="user">
        <SmoothScroll>
          <a
            href="#main"
            className="label-mono fixed left-4 top-4 z-[200] -translate-y-24 rounded-full bg-fg px-4 py-3 text-bg transition-transform focus:translate-y-0"
          >
            Skip to content
          </a>
          <Intro />
          <Nav />
          <main id="main" tabIndex={-1} className="outline-none">
            {keys.map((k) => {
              const S = SECTIONS[k];
              return <S key={k} />;
            })}
          </main>
          {!only || only === "contact" ? <Footer /> : null}
          <CommandPalette />
          <CursorLabel />
          <Toaster
            position="bottom-center"
            toastOptions={{
              className: "!rounded-full !border !border-line-strong !bg-surface !text-fg !font-sans !shadow-none",
              descriptionClassName: "!text-muted",
            }}
          />
        </SmoothScroll>
      </MotionConfig>
    </LazyMotion>
  );
}
