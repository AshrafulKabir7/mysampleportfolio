import { ArrowUpRight } from "lucide-react";
import type { ComponentPropsWithoutRef, PointerEvent, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Magnetic } from "./Magnetic";

/** "Online" dot in flag green with a compositor-only ping ring (.live-dot::after) */
export function LiveDot({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("live-dot relative inline-block size-2 shrink-0 rounded-full bg-live", className)}
    />
  );
}

/** Screen-reader suffix for links that open a new tab */
export const NewTab = () => <span className="sr-only"> (opens in a new tab)</span>;

type ChipTone = "default" | "accent" | "live" | "solid";

/** Small mono pill for tags, statuses and stack items */
export function Chip({
  children,
  tone = "default",
  className,
}: {
  children: ReactNode;
  tone?: ChipTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "label-mono inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[0.66rem]",
        tone === "default" && "border-line-strong text-muted",
        tone === "accent" && "border-accent/40 bg-accent-soft text-accent-text",
        tone === "live" && "border-live/40 text-live",
        tone === "solid" && "border-transparent bg-fg text-bg",
        className,
      )}
    >
      {children}
    </span>
  );
}

type ButtonVariant = "primary" | "outline" | "ghost";

type ButtonProps = {
  variant?: ButtonVariant;
  icon?: ReactNode;
  magnetic?: boolean;
  external?: boolean;
} & ComponentPropsWithoutRef<"a">;

const buttonBase =
  "group relative inline-flex h-12 items-center gap-2.5 rounded-full px-6 text-[0.95rem] font-medium tracking-[-0.01em] transition-[background-color,color,border-color,transform] duration-300 active:scale-[0.97]";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-fg text-bg hover:bg-accent-strong hover:text-on-accent",
  outline: "border border-line-strong text-fg hover:border-fg",
  ghost: "text-fg hover:text-accent px-3",
};

/** Link styled as a pill button. External links get rel + an ↗ icon unless `icon` is given. */
export function ButtonLink({
  variant = "primary",
  icon,
  magnetic = false,
  external,
  className,
  children,
  ...rest
}: ButtonProps) {
  const isExternal = external ?? /^https?:/.test(rest.href ?? "");
  const el = (
    <a
      className={cn(buttonBase, buttonVariants[variant], className)}
      {...(isExternal ? { target: "_blank", rel: "noreferrer noopener" } : {})}
      {...rest}
    >
      <span>{children}</span>
      {isExternal ? <NewTab /> : null}
      {icon ??
        (isExternal ? (
          <ArrowUpRight
            aria-hidden="true"
            className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          />
        ) : null)}
    </a>
  );
  return magnetic ? <Magnetic>{el}</Magnetic> : el;
}

/** Same look as ButtonLink but a <button> */
export function Button({
  variant = "primary",
  icon,
  magnetic = false,
  className,
  children,
  ...rest
}: { variant?: ButtonVariant; icon?: ReactNode; magnetic?: boolean } & ComponentPropsWithoutRef<"button">) {
  const el = (
    <button type="button" className={cn(buttonBase, buttonVariants[variant], className)} {...rest}>
      <span>{children}</span>
      {icon}
    </button>
  );
  return magnetic ? <Magnetic>{el}</Magnetic> : el;
}

/** Inline text link with accent underline that draws from the left */
export function TextLink({ className, children, ...rest }: ComponentPropsWithoutRef<"a">) {
  const isExternal = /^https?:/.test(rest.href ?? "");
  return (
    <a
      className={cn("link-draw inline-flex items-center gap-1 pb-0.5", className)}
      {...(isExternal ? { target: "_blank", rel: "noreferrer noopener" } : {})}
      {...rest}
    >
      {children}
      {isExternal ? <NewTab /> : null}
      {isExternal ? <ArrowUpRight aria-hidden="true" className="size-3.5" /> : null}
    </a>
  );
}

/** Pointer-follow spotlight: spread onto a `.spotlight` element */
export const spotlightHandlers = {
  onPointerMove: (e: PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  },
};
