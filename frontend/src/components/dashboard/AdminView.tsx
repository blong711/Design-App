"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Copy, Plus, MoreVertical, DollarSign, Activity, FileCheck, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminView() {
  const [stats, setStats] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
    fetchTickets();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get("/analytics/overview");
      setStats(res.data);
    } catch (e) {
      console.error("Failed to load stats", e);
    }
  };

  const fetchTickets = async () => {
    try {
      const res = await api.get("/tickets");
      setTickets(res.data);
    } catch (e) {
      console.error("Failed to load tickets", e);
    }
  };

  const statCards = [
    { title: "Total Tickets", value: stats?.total_tickets || 0, icon: Activity, color: "text-blue-400" },
    { title: "Completed", value: stats?.completed_tickets || 0, icon: FileCheck, color: "text-green-400" },
    { title: "To Pay (Debt)", value: `$${stats?.total_unpaid || 0}`, icon: AlertCircle, color: "text-red-400" },
    { title: "Total Paid", value: `$${stats?.total_paid || 0}`, icon: DollarSign, color: "text-primary" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
          <p className="text-muted-foreground mt-1 text-sm">Welcome back, here's what's happening today.</p>
        </div>
        <button className="bg-primary/20 hover:bg-primary/40 border border-primary/30 px-5 py-2.5 rounded-xl font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all flex items-center gap-2">
          <Plus className="w-5 h-5" />
          <span>New Ticket</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className="p-6 rounded-2xl glass-panel relative overflow-hidden group"
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

      {/* Recent Tickets Table */}
      <div className="rounded-2xl glass-panel p-6">
        <div className="flex justify-between items-center mb-6">
           <h3 className="text-xl font-semibold">Recent Assignments</h3>
           <button className="text-sm text-primary hover:text-primary-foreground underline underline-offset-4 transition-colors">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-white/50 text-sm">
                <th className="pb-4 font-medium px-4">Ticket Info</th>
                <th className="pb-4 font-medium px-4">Status</th>
                <th className="pb-4 font-medium px-4">Price</th>
                <th className="pb-4 font-medium px-4">Assignee</th>
                <th className="pb-4 font-medium px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tickets.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-white/40">No tickets found.</td>
                </tr>
              )}
              {tickets.slice(0, 10).map((ticket) => (
                <tr key={ticket.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                  <td className="py-4 px-4">
                    <div className="font-semibold text-white/90">{ticket.title}</div>
                    <div className="text-xs text-muted-foreground mt-1 truncate max-w-[200px]">{ticket.description}</div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="px-3 py-1 rounded-full text-xs font-medium border border-white/10"
                      style={{
                        backgroundColor: 
                          ticket.status === 'completed' ? 'rgba(74, 222, 128, 0.1)' : 
                          ticket.status === 'review' ? 'rgba(250, 204, 21, 0.1)' :
                          ticket.status === 'in_progress' ? 'rgba(96, 165, 250, 0.1)' : 'rgba(255,255,255,0.05)',
                        color:
                          ticket.status === 'completed' ? '#4ade80' : 
                          ticket.status === 'review' ? '#facc15' :
                          ticket.status === 'in_progress' ? '#60a5fa' : '#a1a1aa'
                      }}
                    >
                      {ticket.status.replace("_", " ").toUpperCase()}
                    </span>
                  </td>
                  <td className="py-4 px-4 font-medium text-white/80">${ticket.price}</td>
                  <td className="py-4 px-4 text-sm text-white/60">{ticket.assigned_to ? "Designer" : "Unassigned"}</td>
                  <td className="py-4 px-4 text-right">
                     <button className="p-2 bg-white/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="w-4 h-4 text-white/60" />
                     </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
