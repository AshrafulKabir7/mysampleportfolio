import { motion } from "motion/react";
import { Terminal, Activity, Zap, Cpu } from "lucide-react";
import { useState, useEffect } from "react";

export function SystemStatus() {
  const [latency, setLatency] = useState(42);
  const [uptime, setUptime] = useState("99.98%");

  useEffect(() => {
    const interval = setInterval(() => {
      setLatency(Math.floor(Math.random() * (50 - 30 + 1)) + 30);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="border-y border-foreground py-6 flex flex-wrap gap-x-12 gap-y-6">
      <div className="flex items-center gap-3">
        <Terminal className="w-4 h-4" />
        <div>
          <p className="font-mono text-[10px] uppercase text-muted-foreground leading-none mb-1">Status</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <p className="font-mono text-xs font-bold uppercase tracking-tight">Active_Node_01</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Activity className="w-4 h-4" />
        <div>
          <p className="font-mono text-[10px] uppercase text-muted-foreground leading-none mb-1">Latency</p>
          <p className="font-mono text-xs font-bold uppercase tracking-tight">{latency}ms</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Zap className="w-4 h-4" />
        <div>
          <p className="font-mono text-[10px] uppercase text-muted-foreground leading-none mb-1">Uptime</p>
          <p className="font-mono text-xs font-bold uppercase tracking-tight">{uptime}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Cpu className="w-4 h-4" />
        <div>
          <p className="font-mono text-[10px] uppercase text-muted-foreground leading-none mb-1">Core_V</p>
          <p className="font-mono text-xs font-bold uppercase tracking-tight">v2.4.0-stable</p>
        </div>
      </div>
    </div>
  );
}
