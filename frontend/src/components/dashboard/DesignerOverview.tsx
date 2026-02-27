"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { CheckCircle2, DollarSign, Activity, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function DesignerOverview({ user }: { user: any }) {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (user?.id) {
          const res = await api.get(`/analytics/designer/${user.id}`);
          setStats(res.data);
        }
      } catch(e) {
        console.error("Failed to load designer stats", e);
      }
    };
    fetchStats();
  }, [user]);

  if (!stats) return <div className="animate-pulse">Loading overview...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Personal Overview</h2>
        <p className="text-muted-foreground mt-1 text-sm">Welcome back! Here are your performance stats for this month.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Tickets This Month", value: stats.total_tickets_this_month || 0, icon: Activity, color: "text-blue-400" },
          { title: "Completed This Month", value: stats.completed_this_month || 0, icon: CheckCircle2, color: "text-green-400" },
          { title: "Total Unpaid (Debt)", value: `$${stats.total_unpaid || 0}`, icon: AlertCircle, color: "text-red-400" },
          { title: "Earnings This Month", value: `$${stats.earnings_this_month || 0}`, icon: DollarSign, color: "text-primary" },
        ].map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className="p-6 rounded-2xl glass-panel relative overflow-hidden group shadow-xl shadow-black/20"
          >
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <card.icon className="w-24 h-24" />
           </div>
           <div className="relative z-10 flex flex-col justify-between h-full">
            <h3 className="text-sm font-medium text-white/70">{card.title}</h3>
            <div className={`text-4xl font-bold mt-4 tracking-tighter ${card.color}`}>
              {card.value}
            </div>
           </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
