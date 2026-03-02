"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Filter, Search } from "lucide-react";

interface User {
  id: string;
  full_name: string;
  username: string;
  role: string;
}

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  completed: { bg: "rgba(74,222,128,0.1)", color: "#4ade80" },
  review: { bg: "rgba(250,204,21,0.1)", color: "#facc15" },
  in_progress: { bg: "rgba(96,165,250,0.1)", color: "#60a5fa" },
  assigned: { bg: "rgba(255,255,255,0.05)", color: "#a1a1aa" },
  pending: { bg: "rgba(255,255,255,0.05)", color: "#a1a1aa" },
};

export default function TicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [userMap, setUserMap] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([
      api.get("/tickets"),
      api.get("/users").catch(() => ({ data: [] })), // graceful fallback if not admin
    ]).then(([ticketRes, userRes]) => {
      setTickets(ticketRes.data);
      const map: Record<string, User> = {};
      (userRes.data as User[]).forEach((u) => { map[u.id] = u; });
      setUserMap(map);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = tickets.filter((t) => {
    const q = search.toLowerCase();
    return (
      t.title?.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q) ||
      (t.assigned_to && userMap[t.assigned_to]?.full_name.toLowerCase().includes(q))
    );
  });

  if (loading) return <div className="animate-pulse text-muted-foreground py-10">Loading tickets...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">All Tickets</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {filtered.length} ticket{filtered.length !== 1 ? "s" : ""} · Manage, filter, and review all design tickets.
          </p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search tickets or assignee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-muted border border-border rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
            />
          </div>
          <button className="bg-muted hover:bg-muted/80 border border-border px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 text-foreground">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl glass-panel shadow-xl shadow-black/20 overflow-hidden">
        <div className="overflow-x-auto min-h-[500px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                <th className="pb-4 pt-5 font-semibold px-5">Ticket</th>
                <th className="pb-4 pt-5 font-semibold px-5">Status</th>
                <th className="pb-4 pt-5 font-semibold px-5">Assignee</th>
                <th className="pb-4 pt-5 font-semibold px-5">Payment</th>
                <th className="pb-4 pt-5 font-semibold px-5">Price</th>
                <th className="pb-4 pt-5 font-semibold px-5 text-right">Created At</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-muted-foreground">
                    {search ? `No tickets matching "${search}".` : "No tickets found."}
                  </td>
                </tr>
              )}
              {filtered.map((ticket) => {
                const assignee = ticket.assigned_to ? userMap[ticket.assigned_to] : null;
                const statusStyle = STATUS_STYLE[ticket.status] ?? STATUS_STYLE.pending;

                return (
                  <tr
                    key={ticket.id}
                    className="border-b border-border hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    {/* Ticket */}
                    <td className="py-4 px-5 w-1/3">
                      <div className="font-semibold text-foreground">{ticket.title}</div>
                      <div className="text-xs text-muted-foreground mt-1 truncate max-w-[250px]">{ticket.description}</div>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-5">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-medium border border-border capitalize"
                        style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}
                      >
                        {ticket.status.replace(/_/g, " ")}
                      </span>
                    </td>

                    {/* Assignee — name + avatar initial */}
                    <td className="py-4 px-5">
                      {assignee ? (
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                            {assignee.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground leading-tight">{assignee.full_name}</p>
                            <p className="text-[11px] text-muted-foreground">@{assignee.username}</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">Unassigned</span>
                      )}
                    </td>

                    {/* Payment */}
                    <td className="py-4 px-5">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${ticket.payment_status === "paid"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                        }`}>
                        {ticket.payment_status?.toUpperCase()}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="py-4 px-5 font-medium text-foreground">${ticket.price}</td>

                    {/* Created At */}
                    <td className="py-4 px-5 text-right text-xs text-muted-foreground">
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
