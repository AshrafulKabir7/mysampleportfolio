import { Toaster, toast } from "sonner";
import { Navbar } from "./components/navbar";
import { Hero } from "./components/hero";
import { SystemStatus } from "./components/system-status";
import { ProjectList } from "./components/projects";
import { TechStack, Footer } from "./components/footer";
import { Preloader } from "./components/preloader";
import { Marquee } from "./components/marquee";
import { Stats } from "./components/stats";
import { Experience } from "./components/experience";
import { Terminal } from "./components/terminal";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";

export default function App() {
  const [booting, setBooting] = useState(true);

  const handleBootComplete = () => {
    setBooting(false);
    toast.success("System initialized: nexus.dev v2.4.0");
  };

  // Lock scroll while the preloader is visible
  useEffect(() => {
    document.body.style.overflow = booting ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [booting]);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-foreground selection:text-background font-display overflow-x-hidden">
      <Toaster position="bottom-right" theme="light" expand={false} richColors />

      <AnimatePresence>
        {booting && <Preloader key="preloader" onComplete={handleBootComplete} />}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: booting ? 0 : 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="max-w-[1400px] mx-auto px-6 md:px-12 border-x border-foreground"
      >
        <Navbar />

        <main>
          <Hero />

          <div className="sticky top-0 z-40 bg-background">
            <SystemStatus />
          </div>

          <Stats />

          <ProjectList />

          <Marquee />

          <TechStack />

          <Experience />

          <Terminal />

          <section className="py-24 border-b border-foreground grid lg:grid-cols-2 gap-12">
            <div className="space-y-12">
              <div className="space-y-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.3em]">// RESEARCH_&_LAB</p>
                <h2 className="font-display text-4xl font-bold uppercase italic">Experimental_Modules</h2>
              </div>
              <div className="grid gap-px bg-foreground border border-foreground">
                {[
                  { name: "NEURAL_MESH", type: "AI", status: "BETA" },
                  { name: "QUANTUM_STASH", type: "SEC", status: "ALPHA" },
                  { name: "FLUX_ROUTER", type: "NET", status: "STABLE" },
                ].map((lab) => (
                  <button
                    key={lab.name}
                    onClick={() => toast(`Module ${lab.name} is currently restricted.`)}
                    className="bg-background p-6 flex justify-between items-center group hover:bg-foreground hover:text-background transition-colors"
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-mono text-[10px] text-muted-foreground group-hover:text-background/50 mb-1">
                        {lab.type}
                      </span>
                      <span className="font-display text-xl font-bold uppercase">{lab.name}</span>
                    </div>
                    <span className="font-mono text-[10px] px-2 py-0.5 border border-current">{lab.status}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-secondary p-12 flex flex-col justify-between border border-foreground/5 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-full opacity-5 group-hover:opacity-10 transition-opacity">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)",
                    backgroundSize: "40px 40px",
                  }}
                />
              </div>
              <div>
                <h3 className="font-serif text-3xl italic mb-6">
                  "Software is a tool for thought, but great software is a playground for the mind."
                </h3>
                <p className="font-mono text-xs uppercase text-muted-foreground font-bold tracking-widest">
                  — ALEX NEXUS
                </p>
              </div>
              <div className="pt-12">
                <p className="font-mono text-[11px] leading-relaxed">
                  // CURRENT_THOUGHTS
                  <br />
                  Thinking about the intersection of low-level systems and high-level abstract interfaces. How can
                  we make the invisible visible without adding noise?
                </p>
              </div>
            </div>
          </section>

          <Footer />
        </main>
      </motion.div>
    </div>
  );
}
