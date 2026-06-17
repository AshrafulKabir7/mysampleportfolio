import { motion } from "motion/react";
import { ArrowRight, Code2, Cpu } from "lucide-react";
import { toast } from "sonner";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import heroImage from "figma:asset/image-2.png";
import { useEffect, useState } from "react";

const ROLES = ["DISTRIBUTED SYSTEMS", "CRYPTOGRAPHIC SECURITY", "REAL-TIME INFRA", "EDITORIAL UI"];

export function Hero() {
  const [roleIdx, setRoleIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setRoleIdx((i) => (i + 1) % ROLES.length), 2600);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="pt-20 pb-12 border-b border-foreground grid lg:grid-cols-[1fr_400px] gap-12">
      <div className="flex flex-col justify-end">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <span className="inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest border border-foreground px-3 py-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              Available for work
            </span>
            <p className="font-display text-sm font-bold uppercase tracking-[0.2em]">
              // SOFTWARE ARCHITECT & ENGINEER
            </p>
          </div>
          <h1 className="font-serif text-[clamp(3.5rem,10vw,7rem)] leading-[0.85] italic mb-8">
            Building systems<br />that solve for<br />
            <span className="not-italic font-display font-bold uppercase tracking-tight">Complexity.</span>
          </h1>
          <p className="font-serif text-2xl max-w-xl text-muted-foreground leading-tight mb-8">
            Alex Nexus — Specializing in high-performance distributed systems, cryptographic security, and editorial-grade digital interfaces.
          </p>

          <div className="flex items-center gap-3 mb-12 font-mono text-xs font-bold uppercase tracking-widest">
            <span className="text-muted-foreground">FOCUS:</span>
            <span className="relative inline-block min-w-[14rem] h-5 overflow-hidden">
              <motion.span
                key={roleIdx}
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: "0%", opacity: 1 }}
                exit={{ y: "-100%", opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.76, 0, 0.24, 1] }}
                className="absolute inset-0 flex items-center"
              >
                {ROLES[roleIdx]}
              </motion.span>
            </span>
          </div>

          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => {
                const el = document.getElementById('projects');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth' });
                  toast.info("Navigating to project directory");
                }
              }}
              className="h-12 px-8 bg-foreground text-background font-mono text-xs font-bold uppercase tracking-widest hover:invert transition-all flex items-center gap-3 cursor-pointer"
            >
              View Directory <ArrowRight className="w-4 h-4" />
            </button>
            <button 
              onClick={() => toast.success("Retrieving latest stack traces...")}
              className="h-12 px-8 border border-foreground font-mono text-xs font-bold uppercase tracking-widest hover:bg-foreground hover:text-background transition-all cursor-pointer"
            >
              Stack_Trace.log
            </button>
          </div>
        </motion.div>
      </div>

      <div className="relative aspect-square border border-foreground bg-secondary overflow-hidden group">
        <ImageWithFallback 
          src={heroImage} 
          alt="Alex Nexus Portfolio Hero" 
          className="absolute inset-0 w-full h-full object-cover grayscale contrast-125 brightness-90 group-hover:scale-105 transition-transform duration-700"
        />
        
        <div className="absolute inset-0 bg-background/20 mix-blend-multiply pointer-events-none" />
        
        {/* Technical Overlays */}
        <div className="absolute inset-0 flex flex-col justify-between p-6 pointer-events-none">
          <div className="flex justify-between items-start">
            <div className="bg-background border border-foreground p-2">
              <Code2 className="w-6 h-6" />
            </div>
            <div className="bg-background border border-foreground px-3 py-1 font-mono text-[9px] uppercase tracking-tighter">
              ID: NEXUS_CORE_v2.4<br />
              LOC: 40.7128° N, 74.0060° W
            </div>
          </div>
          
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="w-4 h-1 bg-foreground" />
                ))}
              </div>
              <p className="font-mono text-[9px] uppercase tracking-widest text-foreground font-bold bg-background px-2 py-0.5 border border-foreground inline-block">
                SYSTEM_STATUS: ACTIVE
              </p>
            </div>
            <div className="bg-background border border-foreground p-2">
              <Cpu className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Scanline Effect */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div 
            className="w-full h-[2px] bg-foreground/10 absolute top-0 left-0"
            animate={{ top: ["0%", "100%"] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          />
        </div>

        <motion.div 
          className="absolute inset-0 bg-foreground pointer-events-none"
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }}
          style={{ originX: 0 }}
        />
      </div>
    </section>
  );
}

