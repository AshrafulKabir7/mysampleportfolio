import { motion } from "motion/react";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

function useClock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const fmt = () =>
      new Date().toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    setTime(fmt());
    const id = setInterval(() => setTime(fmt()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const time = useClock();

  const goTo = (id: string, label: string) => {
    setIsOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      toast.info(`Navigating to ${label}`);
    } else {
      toast.info(`Accessing ${label} directory...`);
    }
  };

  const navItems = [
    { label: "Projects", id: "projects" },
    { label: "Stack", id: "stack" },
    { label: "About", id: "about" },
    { label: "Contact", id: "contact" },
  ];

  return (
    <nav className="relative z-50 flex items-center justify-between py-6 border-b border-foreground">
      <div className="flex items-center gap-3">
        <motion.div
          className="w-4 h-4 bg-foreground"
          animate={{ rotate: [0, 90, 90, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <a
          href="/"
          className="font-mono text-xs font-bold uppercase tracking-widest hover:opacity-70 transition-opacity"
        >
          Nexus.dev
        </a>
        <span className="hidden lg:inline-flex items-center gap-2 ml-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          {time} UTC
        </span>
      </div>

      <div className="hidden md:flex items-center gap-8">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={() => goTo(item.id, item.label)}
            className="font-display text-xs font-bold uppercase tracking-wider hover:line-through transition-all"
          >
            {item.label}
          </button>
        ))}
      </div>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center gap-2 font-mono text-[10px] font-bold uppercase"
      >
        {isOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        <span className="hidden md:inline">{isOpen ? "Close" : "Index"}</span>
      </button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full left-0 w-full bg-background border-x border-b border-foreground p-8 grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          <div>
            <p className="font-mono text-[10px] uppercase text-muted-foreground mb-4">// NAVIGATION</p>
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => goTo(item.id, item.label)}
                  className="font-display text-xl font-bold uppercase hover:line-through text-left"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase text-muted-foreground mb-4">// SOCIALS</p>
            <div className="flex flex-col gap-2">
              {["Github", "LinkedIn", "Twitter", "Email"].map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    setIsOpen(false);
                    toast.info(`Opening ${item}`);
                  }}
                  className="font-display text-xl font-bold uppercase hover:line-through text-left"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className="col-span-2">
            <p className="font-mono text-[10px] uppercase text-muted-foreground mb-4">// SYSTEM_METRIC</p>
            <div className="h-20 bg-muted border border-foreground/10 flex items-end p-2 gap-1">
              {[40, 70, 45, 90, 65, 80, 55, 75].map((h, i) => (
                <motion.div
                  key={i}
                  className="flex-1 bg-foreground"
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ delay: i * 0.05 }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </nav>
  );
}
