import { motion } from "motion/react";
import { Cpu, Database, Globe, Layers, Lock, Zap } from "lucide-react";

const stack = [
  { name: "LANGUAGES", items: ["TypeScript", "Rust", "Python", "Go", "C++"], icon: <Cpu className="w-5 h-5" /> },
  { name: "BACKEND", items: ["Node.js", "PostgreSQL", "Redis", "gRPC", "Docker"], icon: <Database className="w-5 h-5" /> },
  { name: "FRONTEND", items: ["React", "Motion", "WASM", "Tailwind", "WebGL"], icon: <Layers className="w-5 h-5" /> },
  { name: "INFRA", items: ["AWS", "Kubernetes", "CI/CD", "Nginx", "Linux"], icon: <Globe className="w-5 h-5" /> },
];

export function TechStack() {
  return (
    <section id="stack" className="py-24 border-b border-foreground">
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-foreground border border-foreground">
        {stack.map((group) => (
          <div key={group.name} className="bg-background p-10 flex flex-col gap-8">
            <div className="flex items-center gap-3">
              {group.icon}
              <h3 className="font-mono text-xs font-bold uppercase tracking-widest">{group.name}</h3>
            </div>
            
            <div className="flex flex-col gap-4">
              {group.items.map((item) => (
                <div key={item} className="flex items-center justify-between group">
                  <span className="font-display text-2xl font-bold uppercase group-hover:italic transition-all">{item}</span>
                  <div className="w-2 h-2 border border-foreground opacity-20 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-20 grid lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <h2 className="font-display text-4xl font-bold uppercase leading-none italic">
            Engineering Principles_
          </h2>
          <p className="font-serif text-xl text-muted-foreground leading-snug">
            I build for scale, security, and developer experience. My workflow is rooted in rigorous testing and semantic architecture.
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase px-3 py-1 bg-secondary border border-foreground/10">
              <Lock className="w-3 h-3" /> Zero_Trust_Auth
            </div>
            <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase px-3 py-1 bg-secondary border border-foreground/10">
              <Zap className="w-3 h-3" /> Sub_50ms_Latency
            </div>
          </div>
        </div>
        
        <div className="aspect-video bg-foreground p-8 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-background/5 -rotate-45 translate-x-32 -translate-y-32 border border-background/20" />
          <p className="font-mono text-[11px] text-background/40 uppercase tracking-widest">// ACTIVE_PROCESS</p>
          <div className="space-y-2">
            <div className="w-full h-1 bg-background/20 overflow-hidden">
              <motion.div 
                className="h-full bg-background"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
            </div>
            <p className="font-mono text-[10px] text-background uppercase">Building: Optimized_Vector_Engine.so</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer id="contact" className="py-24 space-y-20">
      <div className="grid md:grid-cols-2 gap-12 items-end">
        <h2 className="font-serif text-[clamp(2.5rem,8vw,5rem)] leading-[0.85] italic">
          Ready to<br />
          <span className="not-italic font-display font-bold uppercase tracking-tight">Integrate?</span>
        </h2>
        <div className="flex flex-col items-end gap-6 text-right">
          <p className="font-serif text-2xl text-muted-foreground max-w-sm">
            Currently accepting high-impact roles and technical consulting.
          </p>
          <a 
            href="mailto:hello@nexus.dev" 
            className="font-display text-3xl font-bold uppercase underline underline-offset-8 decoration-1 hover:decoration-4 transition-all"
          >
            hello@nexus.dev
          </a>
        </div>
      </div>

      <div className="pt-20 border-t border-foreground flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 bg-foreground" />
          <p className="font-mono text-xs font-bold uppercase tracking-widest">Nexus.dev // 2026</p>
        </div>

        <div className="flex gap-8">
          {["Github", "LinkedIn", "Twitter", "CV"].map((item) => (
            <a key={item} href="#" className="font-mono text-[10px] font-bold uppercase tracking-widest hover:line-through">{item}</a>
          ))}
        </div>

        <div className="flex items-center gap-4 text-muted-foreground font-mono text-[10px] uppercase">
          <span>LAT: 37.7749</span>
          <span>LONG: -122.4194</span>
          <span className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            LIVE
          </span>
        </div>
      </div>
    </footer>
  );
}
