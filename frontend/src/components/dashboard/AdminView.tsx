"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { Plus, MoreVertical, DollarSign, Activity, FileCheck, AlertCircle, X, Upload, ImageIcon, Loader2, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function NewTicketDrawer({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const currentUser = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "{}") : {};

  const reset = () => {
    setTitle(""); setDescription(""); setPrice("");
    setImageFile(null); setImagePreview(null);
    setError(null); setSuccess(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!title.trim()) { setError("Title is required"); return; }
    if (!description.trim()) { setError("Description is required"); return; }
    setError(null);
    setLoading(true);
    try {
      let image_url: string | null = null;
      if (imageFile) {
        const fd = new FormData();
        fd.append("file", imageFile);
        const r = await api.post("/s3/upload/ticket-image", fd, { headers: { "Content-Type": "multipart/form-data" } });
        image_url = r.data.public_url;
      }
      await api.post("/tickets/", {
        title: title.trim(),
        description: description.trim(),
        price: parseFloat(price) || 0,
        image_url,
      });
      setSuccess(true);
      setTimeout(() => { handleClose(); onCreated(); }, 1200);
    } catch (e: any) {
      setError(e.response?.data?.detail || "Failed to create ticket");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={handleClose}
          />
          {/* Drawer */}
          <motion.div
            key="drawer"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 35 }}
            className="fixed right-0 top-0 h-full w-full max-w-lg bg-background border-l border-border z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <div>
                <h2 className="text-xl font-bold text-foreground">New Ticket</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Create a new design ticket</p>
              </div>
              <button onClick={handleClose} className="p-2 rounded-lg hover:bg-foreground/5 transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {/* Created By */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Created By</label>
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-foreground/5 border border-border">
                  <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center font-bold text-primary text-sm shrink-0">
                    {currentUser.full_name?.charAt(0)?.toUpperCase() || "A"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{currentUser.full_name || "Admin"}</p>
                    <p className="text-xs text-muted-foreground capitalize">{currentUser.role}</p>
                  </div>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Title <span className="text-red-400">*</span></label>
                <input
                  value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Design new banner for campaign"
                  className="w-full px-4 py-3 rounded-xl bg-foreground/5 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all text-sm"
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Price (USD)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                  <input
                    type="number" min="0" step="0.01"
                    value={price} onChange={e => setPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-3 rounded-xl bg-foreground/5 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all text-sm"
                  />
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Reference Image</label>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
                {imagePreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-border group">
                    <img src={imagePreview} alt="preview" className="w-full max-h-52 object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button onClick={() => fileRef.current?.click()} className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-white text-sm font-medium hover:bg-white/30 transition-colors">
                        Change
                      </button>
                      <button onClick={() => { setImageFile(null); setImagePreview(null); }} className="px-4 py-2 bg-red-500/20 backdrop-blur-sm rounded-lg text-red-300 text-sm font-medium hover:bg-red-500/30 transition-colors">
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="w-full py-10 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all flex flex-col items-center gap-3 text-muted-foreground hover:text-primary group"
                  >
                    <div className="w-12 h-12 rounded-full bg-foreground/5 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">Click to upload image</p>
                      <p className="text-xs mt-1">JPG, PNG, GIF, WebP</p>
                    </div>
                  </button>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Description <span className="text-red-400">*</span></label>
                <textarea
                  value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Describe what needs to be designed, any references, colors, style..."
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl bg-foreground/5 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all text-sm resize-none"
                />
              </div>

              {error && (
                <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                Status: <span className="font-medium text-foreground">Pending</span>
              </div>
              <div className="flex gap-3">
                <button onClick={handleClose} className="px-5 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-all">
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || success}
                  className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-all flex items-center gap-2 shadow-lg shadow-primary/30"
                >
                  {success ? <><CheckCircle2 className="w-4 h-4" /> Created!</>
                    : loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
                    : <><Upload className="w-4 h-4" /> Create Ticket</>}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function AdminView() {
  const [stats, setStats] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

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
      <NewTicketDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onCreated={() => { fetchStats(); fetchTickets(); }}
      />

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
          <p className="text-muted-foreground mt-1 text-sm">Welcome back, here's what's happening today.</p>
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          className="bg-primary hover:bg-primary/90 px-5 py-2.5 rounded-xl font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all flex items-center gap-2"
        >
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
            <h3 className="text-sm font-medium text-muted-foreground">{card.title}</h3>
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
              <tr className="border-b border-border text-muted-foreground text-sm">
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
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">No tickets found.</td>
                </tr>
              )}
              {tickets.slice(0, 10).map((ticket) => (
                <tr key={ticket.id} className="border-b border-border hover:bg-foreground/5 transition-colors group">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      {ticket.image_url && (
                        <img src={ticket.image_url} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0 border border-border" />
                      )}
                      <div>
                        <div className="font-semibold text-foreground">{ticket.title}</div>
                        <div className="text-xs text-muted-foreground mt-1 truncate max-w-[200px]">{ticket.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="px-3 py-1 rounded-full text-xs font-medium border border-border"
                      style={{
                        backgroundColor:
                          ticket.status === 'completed' ? 'rgba(74, 222, 128, 0.1)' :
                          ticket.status === 'review' ? 'rgba(250, 204, 21, 0.1)' :
                          ticket.status === 'in_progress' ? 'rgba(96, 165, 250, 0.1)' : 'rgba(128,128,128,0.1)',
                        color:
                          ticket.status === 'completed' ? '#4ade80' :
                          ticket.status === 'review' ? '#facc15' :
                          ticket.status === 'in_progress' ? '#60a5fa' : '#a1a1aa'
                      }}
                    >
                      {ticket.status.replace("_", " ").toUpperCase()}
                    </span>
                  </td>
                  <td className="py-4 px-4 font-medium text-foreground">${ticket.price}</td>
                  <td className="py-4 px-4 text-sm text-muted-foreground">{ticket.assigned_to ? "Designer" : "Unassigned"}</td>
                  <td className="py-4 px-4 text-right">
                     <button className="p-2 bg-foreground/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
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
