"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Filter, Search } from "lucide-react";

export default function TicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const res = await api.get("/tickets");
      setTickets(res.data);
    } catch (e) {
      console.error("Failed to load tickets", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="animate-pulse">Loading tickets...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">All Tickets</h2>
          <p className="text-muted-foreground mt-1 text-sm">Manage, filter, and review all design tickets.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
             <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
             <input type="text" placeholder="Search tickets..." className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-white" />
          </div>
          <button className="bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>
      </div>

      <div className="rounded-2xl glass-panel p-6 shadow-xl shadow-black/20">
        <div className="overflow-x-auto min-h-[500px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-white/50 text-sm">
                <th className="pb-4 font-medium px-4">Ticket</th>
                <th className="pb-4 font-medium px-4">Status</th>
                <th className="pb-4 font-medium px-4">Assignee</th>
                <th className="pb-4 font-medium px-4">Payment</th>
                <th className="pb-4 font-medium px-4">Price</th>
                <th className="pb-4 font-medium px-4 text-right">Created At</th>
              </tr>
            </thead>
            <tbody>
              {tickets.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-white/40">No tickets found.</td>
                </tr>
              )}
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group cursor-pointer">
                  <td className="py-4 px-4 w-1/3">
                    <div className="font-semibold text-white/90">{ticket.title}</div>
                    <div className="text-xs text-muted-foreground mt-1 truncate max-w-[250px]">{ticket.description}</div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="px-3 py-1 rounded-full text-xs font-medium border border-white/10 capitalize"
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
                      {ticket.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm text-white/70">{ticket.assigned_to || "Unassigned"}</td>
                  <td className="py-4 px-4">
                     <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${ticket.payment_status === 'paid' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {ticket.payment_status.toUpperCase()}
                     </span>
                  </td>
                  <td className="py-4 px-4 font-medium text-white/80">${ticket.price}</td>
                  <td className="py-4 px-4 text-right text-xs text-white/50">
                    {new Date(ticket.created_at).toLocaleDateString()}
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
