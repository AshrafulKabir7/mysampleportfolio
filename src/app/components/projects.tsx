import { motion } from "motion/react";
import { ExternalLink, Github, FileCode2 } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { toast } from "sonner";

const projects = [
  {
    id: "01",
    title: "SYYNAPSE_OS",
    description: "Distributed operating system kernel visualizer and debugger for high-concurrency environments.",
    tech: ["Rust", "WASM", "WebGL"],
    image: "https://images.unsplash.com/photo-1555432384-3b2fa7b650c9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGJsYWNrJTIwd2hpdGUlMjB0ZWNoJTIwY2lyY3VpdHxlbnwxfHx8fDE3ODE2ODk2NzF8MA&ixlib=rb-4.1.0&q=80&w=1080",
    link: "#"
  },
  {
    id: "02",
    title: "VECTOR_CORE",
    description: "Machine learning orchestration platform designed for real-time model deployment and monitoring.",
    tech: ["Python", "Docker", "PyTorch"],
    image: "https://images.unsplash.com/photo-1484665739383-a1069a82d4be?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwc29mdHdhcmUlMjBjb2RlJTIwYXJjaGl0ZWN0dXJlfGVufDF8fHx8MTc4MTY4OTY3MXww&ixlib=rb-4.1.0&q=80&w=1080",
    link: "#"
  },
  {
    id: "03",
    title: "PRISM_DB",
    description: "High-performance time-series database engine with built-in cryptographic audit trails.",
    tech: ["C++", "gRPC", "LevelDB"],
    image: "https://images.unsplash.com/photo-1617050318658-a9a3175e34cb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxibGFjayUyMHdoaXRlJTIwZWRpdG9yaWFsJTIwZGVzaWduJTIwbGF5b3V0fGVufDF8fHx8MTc4MTY4OTY3MXww&ixlib=rb-4.1.0&q=80&w=1080",
    link: "#"
  }
];

export function ProjectList() {
  return (
    <section id="projects" className="py-24 border-b border-foreground">
      <div className="flex justify-between items-end mb-16">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] mb-4">// DIRECTORY_LIST</p>
          <h2 className="font-display text-5xl font-bold uppercase tracking-tighter italic">Selected Works</h2>
        </div>
        <p className="font-serif text-xl max-w-xs text-right text-muted-foreground hidden md:block">
          A collection of experiments in systems engineering and technical design.
        </p>
      </div>

      <div className="grid gap-px bg-foreground border border-foreground">
        {projects.map((project, i) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="group relative bg-background grid md:grid-cols-[100px_1fr_300px_150px] items-center gap-8 p-8 hover:bg-secondary transition-colors cursor-crosshair"
          >
            <span className="font-mono text-xs text-muted-foreground">{project.id}</span>
            
            <div>
              <h3 className="font-display text-3xl font-bold uppercase tracking-tight group-hover:line-through">{project.title}</h3>
              <p className="font-serif text-sm text-muted-foreground mt-2 max-w-md">{project.description}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {project.tech.map((t) => (
                <span key={t} className="px-3 py-1 border border-foreground font-mono text-[10px] font-bold uppercase">{t}</span>
              ))}
            </div>

            <div className="flex justify-end gap-4">
              <button 
                onClick={() => toast.info(`Opening Github repo for ${project.title}`)}
                className="p-3 border border-foreground hover:bg-foreground hover:text-background transition-colors"
              >
                <Github className="w-4 h-4" />
              </button>
              <button 
                onClick={() => toast.info(`Launching live demo for ${project.title}`)}
                className="p-3 border border-foreground hover:bg-foreground hover:text-background transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>

            {/* Hover Image Preview */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-64 h-40 opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-10 mr-12 hidden lg:block overflow-hidden border border-foreground translate-x-10 group-hover:translate-x-0">
              <ImageWithFallback 
                src={project.image} 
                alt={project.title}
                className="w-full h-full object-cover grayscale"
              />
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
