import { AnimatePresence, m } from "motion/react";
import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { profile } from "@/content/site";
import { copyText } from "@/lib/hooks";
import { EASE_OUT } from "@/components/primitives/Reveal";

/** The email address as one giant button: click copies it, the label swaps to "Copied". */
export function EmailCopy() {
  const [copied, setCopied] = useState(false);
  const timer = useRef(0);
  const [user, domain] = profile.email.split("@");

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const onCopy = async () => {
    const ok = await copyText(profile.email);
    if (ok) {
      toast("Email copied — talk soon");
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 2400);
    } else {
      toast("Couldn’t reach the clipboard", { description: profile.email });
    }
  };

  return (
    <button
      type="button"
      onClick={onCopy}
      data-cursor="Copy"
      aria-label={`Copy email address ${profile.email}`}
      className="group flex w-full flex-col items-start gap-5 text-left md:flex-row md:items-end md:justify-between md:gap-10"
    >
      <span className="min-w-0">
        <span className="label-mono mb-4 block text-muted md:mb-5">Email · tap or click to copy</span>
        <span className="link-draw inline pb-1 font-display text-[clamp(1.4rem,3.6vw,3rem)] font-medium leading-[1.15] tracking-[-0.03em] text-fg transition-colors duration-300 [box-decoration-break:clone] group-hover:[background-size:100%_1px] group-focus-visible:[background-size:100%_1px]">
          {user}@<wbr />
          {domain}
        </span>
      </span>
      <span
        aria-hidden="true"
        className="label-mono relative inline-flex h-10 shrink-0 items-center gap-2 overflow-hidden rounded-full border border-line-strong px-4 text-fg transition-colors duration-300 group-hover:border-fg"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <m.span
            key={copied ? "done" : "copy"}
            className="inline-flex items-center gap-2"
            initial={{ y: "120%", opacity: 0 }}
            animate={{ y: "0%", opacity: 1 }}
            exit={{ y: "-120%", opacity: 0 }}
            transition={{ duration: 0.45, ease: EASE_OUT }}
          >
            {copied ? (
              <>
                <Check className="size-3.5" strokeWidth={2} /> Copied
              </>
            ) : (
              <>
                <Copy className="size-3.5" strokeWidth={1.8} /> Copy
              </>
            )}
          </m.span>
        </AnimatePresence>
      </span>
    </button>
  );
}
