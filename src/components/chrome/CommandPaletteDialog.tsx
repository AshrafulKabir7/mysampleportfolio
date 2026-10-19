import { AnimatePresence, m } from "motion/react";
import { Command, useCommandState } from "cmdk";
import {
  ArrowUp,
  BookOpen,
  Boxes,
  Copy,
  FileText,
  FlaskConical,
  Github,
  Hammer,
  IdCard,
  Linkedin,
  Mail,
  Quote,
  Route,
  Search,
  SunMoon,
  Telescope,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { toast } from "sonner";
import { builds, nav, papers, profile, threads } from "@/content/site";
import { NewTab } from "@/components/primitives/Bits";
import { EASE_OUT } from "@/components/primitives/Reveal";
import { copyText } from "@/lib/hooks";
import { scrollToId } from "@/lib/scroll";
import type { Theme } from "@/lib/theme";
import { openExternal } from "./ChromeHelpers";
import { toggleTheme } from "./ThemeToggle";

/* Lazily loaded by CommandPalette.tsx on first open (never prerendered or hydrated). */

const SECTION_ICONS: Record<string, LucideIcon> = {
  research: FlaskConical,
  builds: Hammer,
  papers: FileText,
  path: Route,
  about: UserRound,
  contact: Mail,
};

/**
 * Stricter than cmdk's fuzzy default: every typed word must appear in the
 * item's value or keywords. Word-start hits rank above mid-word hits.
 */
function filterItems(value: string, search: string, keywords?: string[]): number {
  const hay = `${value} ${(keywords ?? []).join(" ")}`.toLowerCase();
  const terms = search.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!terms.length) return 1;
  let score = 0;
  for (const term of terms) {
    const i = hay.indexOf(term);
    if (i < 0) return 0;
    score += i === 0 || /[^a-z0-9]/.test(hay[i - 1]) ? 1 : 0.6;
  }
  return score / terms.length;
}

/** Scroll to an element id if it is on the page, otherwise to its section */
function jumpTo(id: string, fallback: string) {
  scrollToId(document.getElementById(id) ? id : fallback);
}

type ItemProps = {
  value: string;
  icon: LucideIcon;
  title: ReactNode;
  sub?: string;
  /** ↵ in-page, ↗ new tab, "copy" clipboard */
  hint: string;
  keywords?: string[];
  onSelect: () => void;
};

function Item({ value, icon: Icon, title, sub, hint, keywords, onSelect }: ItemProps) {
  return (
    <Command.Item
      value={value}
      keywords={keywords}
      onSelect={onSelect}
      className="group relative flex cursor-pointer select-none items-center gap-3 rounded-xl px-3 py-2 text-[0.95rem] text-fg outline-none transition-colors duration-150 data-[selected=true]:bg-surface-2 before:absolute before:inset-y-2 before:left-0 before:w-[2px] before:rounded-full before:bg-accent before:opacity-0 before:transition-opacity data-[selected=true]:before:opacity-100"
    >
      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-line text-muted transition-colors group-data-[selected=true]:border-line-strong group-data-[selected=true]:text-fg">
        <Icon aria-hidden="true" className="size-[15px]" strokeWidth={1.75} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate leading-snug">
          {title}
          {hint === "↗" ? <NewTab /> : null}
        </span>
        {sub ? <span className="truncate text-[0.8rem] leading-snug text-muted">{sub}</span> : null}
      </span>
      <span
        aria-hidden="true"
        className="label-mono shrink-0 text-[0.66rem] text-subtle transition-colors group-data-[selected=true]:text-accent-text"
      >
        {hint}
      </span>
    </Command.Item>
  );
}

const groupClass =
  "px-2 pb-1 [&_[cmdk-group-heading]]:label-mono [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-2 [&_[cmdk-group-heading]]:pt-4 [&_[cmdk-group-heading]]:text-[0.62rem] [&_[cmdk-group-heading]]:text-muted";

/** Polite result count for screen readers (silent until the user types) */
function ResultCount() {
  const search = useCommandState((s) => s.search);
  const count = useCommandState((s) => s.filtered.count);
  const text = !search.trim() ? "" : count ? `${count} ${count === 1 ? "result" : "results"}` : "No matches";
  return (
    <div aria-live="polite" aria-atomic="true" className="sr-only">
      {text}
    </div>
  );
}

/**
 * cmdk computes aria-activedescendant before the new item is marked selected,
 * so it lags one step (and is empty on open). Re-point it at the item that is
 * actually selected whenever the selection or the list changes.
 */
function useActiveDescendant(root: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const sync = () => {
      const id = el.querySelector<HTMLElement>('[cmdk-item][aria-selected="true"]')?.id ?? "";
      for (const host of el.querySelectorAll<HTMLElement>("[cmdk-input], [cmdk-list]")) {
        if (!id) host.removeAttribute("aria-activedescendant");
        else if (host.getAttribute("aria-activedescendant") !== id) host.setAttribute("aria-activedescendant", id);
      }
    };
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(el, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["aria-selected", "aria-activedescendant"],
    });
    return () => mo.disconnect();
  }, [root]);
}

type Props = {
  open: boolean;
  /** close the palette; restore = false when the command moves focus itself */
  onClose: (restore?: boolean) => void;
  theme: Theme;
  isMac: boolean;
};

export default function CommandPaletteDialog({ open, onClose, theme, isMac }: Props) {
  return (
    <AnimatePresence>
      {open ? <Palette key="palette" onClose={onClose} theme={theme} isMac={isMac} /> : null}
    </AnimatePresence>
  );
}

function Palette({ onClose, theme, isMac }: Omit<Props, "open">) {
  const rootRef = useRef<HTMLDivElement>(null);
  useActiveDescendant(rootRef);

  /** close (unlocking scroll), then act on the next tick so scrolling works again */
  const run =
    (fn: () => void, { jump = false } = {}) =>
    () => {
      onClose(!jump);
      window.setTimeout(fn, 30);
    };

  const copy = async (text: string, what: "Email" | "BibTeX") => {
    const ok = await copyText(text);
    if (ok) toast(`${what} copied`, what === "Email" ? { description: text } : undefined);
    else
      toast("Couldn’t reach the clipboard", {
        description: what === "Email" ? text : "Open Cite under Papers and select the BibTeX",
      });
  };

  return (
    <div className="fixed inset-0 z-[160] px-4">
      {/* the dim layer fades on its own; an opacity ancestor would switch off the panel's backdrop blur */}
      <m.div
        aria-hidden="true"
        className="absolute inset-0 bg-bg/60 backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        onPointerDown={() => onClose()}
      />
      <m.div
        role="dialog"
        aria-modal="true"
        aria-label="Command menu"
        initial={{ opacity: 0, scale: 0.97, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: -6, transition: { duration: 0.16 } }}
        transition={{ duration: 0.38, ease: EASE_OUT }}
        className="glass relative mx-auto mt-[12vh] max-w-xl overflow-hidden rounded-[20px] border border-line-strong"
        onKeyDown={(e) => {
          // nothing in here is tabbable except the input: keep focus inside
          if (e.key === "Tab") e.preventDefault();
        }}
      >
        <Command ref={rootRef} label="Command menu" loop filter={filterItems} className="flex flex-col">
          <ResultCount />
          <div className="flex items-center gap-3 border-b border-line px-5">
            <Search aria-hidden="true" className="size-4 shrink-0 text-muted" />
            <Command.Input
              autoFocus
              placeholder="Search sections, papers, builds, actions…"
              className="h-14 w-full min-w-0 bg-transparent text-[1rem] text-fg outline-none placeholder:text-muted focus-visible:outline-none"
            />
            <kbd className="label-mono shrink-0 rounded-md border border-line px-1.5 py-1 text-[0.58rem] text-muted">
              esc
            </kbd>
          </div>

          <Command.List
            data-lenis-prevent=""
            label="Commands"
            className="no-scrollbar max-h-[min(60vh,520px)] overflow-y-auto overscroll-contain pb-2"
          >
            <Command.Empty className="px-5 py-10 text-center text-[0.95rem] text-muted">
              No matches. Try “sepsis”, “WebGPU” or “BibTeX”.
            </Command.Empty>

            <Command.Group heading="Go to" className={groupClass}>
              <Item
                value="go top"
                icon={ArrowUp}
                title="Top"
                hint="↵"
                keywords={["home", "hero", "start"]}
                onSelect={run(() => scrollToId("top"), { jump: true })}
              />
              {nav.map((n) => (
                <Item
                  key={n.id}
                  value={`go ${n.id}`}
                  icon={SECTION_ICONS[n.id] ?? ArrowUp}
                  title={
                    <>
                      {n.label}
                      <span aria-hidden="true" className="label-mono ml-2 text-[0.58rem] text-subtle">
                        §{n.index}
                      </span>
                    </>
                  }
                  hint="↵"
                  keywords={[n.label]}
                  onSelect={run(() => scrollToId(n.id), { jump: true })}
                />
              ))}
            </Command.Group>

            <Command.Group heading="Actions" className={groupClass}>
              <Item
                value="copy email"
                icon={Copy}
                title="Copy email address"
                sub={profile.email}
                hint="copy"
                keywords={["email", "contact", "mail"]}
                onSelect={run(() => void copy(profile.email, "Email"))}
              />
              <Item
                value="open cv"
                icon={FileText}
                title="Open CV"
                hint="↗"
                keywords={["resume", "cv", "curriculum vitae"]}
                onSelect={run(() => openExternal(profile.links.cv))}
              />
              <Item
                value="toggle theme"
                icon={SunMoon}
                title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
                hint="↵"
                keywords={["theme", "dark", "light", "mode", "colour", "color"]}
                onSelect={run(() => toggleTheme())}
              />
              <Item
                value="github code"
                icon={Github}
                title="Browse the code on GitHub"
                hint="↗"
                keywords={["source", "github", "repositories", "code"]}
                onSelect={run(() => openExternal(profile.links.github))}
              />
            </Command.Group>

            <Command.Group heading="Research" className={groupClass}>
              {threads.map((t) => (
                <Item
                  key={t.id}
                  value={`research ${t.id}`}
                  icon={t.id === "exoplanet" ? Telescope : FlaskConical}
                  title={t.title}
                  sub={t.kicker}
                  hint="↵"
                  keywords={[t.title, t.kicker, ...t.tags]}
                  onSelect={run(() => jumpTo(`thread-${t.id}`, "research"), { jump: true })}
                />
              ))}
            </Command.Group>

            <Command.Group heading="Builds" className={groupClass}>
              {builds.map((b) => (
                <Item
                  key={b.slug}
                  value={`build ${b.slug}`}
                  icon={Boxes}
                  title={b.name}
                  sub={b.tagline}
                  hint="↗"
                  keywords={[b.name, b.tagline, ...b.stack]}
                  onSelect={run(() => openExternal(b.live ?? b.repo))}
                />
              ))}
            </Command.Group>

            <Command.Group heading="Papers" className={groupClass}>
              {papers.map((p, i) => {
                const doi = p.links.find((l) => l.label === "DOI")?.href;
                return (
                  <Item
                    key={`paper-${i}`}
                    value={`paper ${i}`}
                    icon={BookOpen}
                    title={p.title}
                    sub={`${p.status} · ${p.year}`}
                    hint={doi ? "↗" : "↵"}
                    keywords={[p.title, p.status, "paper", "publication"]}
                    onSelect={doi ? run(() => openExternal(doi)) : run(() => scrollToId("papers"), { jump: true })}
                  />
                );
              })}
              {papers
                .filter((p) => p.bibtex)
                .map((p, i) => (
                  <Item
                    key={`bib-${i}`}
                    value={`bibtex ${i}`}
                    icon={Quote}
                    title="Copy BibTeX"
                    sub={p.title}
                    hint="copy"
                    keywords={["bibtex", "cite", "citation", "paper", p.title]}
                    onSelect={run(() => void copy(p.bibtex ?? "", "BibTeX"))}
                  />
                ))}
            </Command.Group>

            <Command.Group heading="Elsewhere" className={groupClass}>
              <Item
                value="link github"
                icon={Github}
                title="GitHub"
                sub={profile.links.github.replace("https://github.com/", "")}
                hint="↗"
                keywords={["github", "code"]}
                onSelect={run(() => openExternal(profile.links.github))}
              />
              <Item
                value="link linkedin"
                icon={Linkedin}
                title="LinkedIn"
                hint="↗"
                keywords={["linkedin", "work"]}
                onSelect={run(() => openExternal(profile.links.linkedin))}
              />
              <Item
                value="link orcid"
                icon={IdCard}
                title="ORCID"
                sub={profile.links.orcid.replace("https://orcid.org/", "")}
                hint="↗"
                keywords={["orcid", "researcher id"]}
                onSelect={run(() => openExternal(profile.links.orcid))}
              />
            </Command.Group>
          </Command.List>

          <div
            aria-hidden="true"
            className="label-mono flex items-center justify-between gap-4 border-t border-line px-5 py-3 text-[0.6rem] text-muted"
          >
            <span>↑↓ navigate · ↵ select · esc close</span>
            <span className="hidden sm:inline">{isMac ? "⌘K" : "Ctrl K"} · /</span>
          </div>
        </Command>
      </m.div>
    </div>
  );
}
