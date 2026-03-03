"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { Plus, DollarSign, Activity, FileCheck, AlertCircle, X, Upload, ImageIcon, Loader2, CheckCircle2, UserPlus, ChevronDown, Paintbrush } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Designer Picker ─────────────────────────────────────────────────────────

function DesignerPicker({
  designers,
  value,
  onChange,
  unassignedLabel = "Unassigned",
}: {
  designers: any[];
  value: string;
  onChange: (id: string) => void;
  unassignedLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = designers.find((d) => d.id === value);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-foreground/5 border transition-all text-sm cursor-pointer ${open ? "border-primary ring-1 ring-primary/30" : "border-border hover:border-foreground/20"
          }`}
      >
        {selected ? (
          <>
            <div className="w-7 h-7 rounded-lg bg-accent/20 border border-accent/30 text-accent flex items-center justify-center text-xs font-bold shrink-0">
              {selected.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{selected.full_name}</p>
              <p className="text-[11px] text-muted-foreground">@{selected.username}</p>
            </div>
          </>
        ) : (
          <>
            <div className="w-7 h-7 rounded-lg bg-muted border border-border flex items-center justify-center shrink-0">
              <Paintbrush className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <span className="flex-1 text-left text-muted-foreground">{unassignedLabel}</span>
          </>
        )}
        <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-[100] bg-background border border-border rounded-xl shadow-2xl shadow-black/40 overflow-hidden">
          {/* Unassigned option */}
          <button
            type="button"
            onClick={() => { onChange(""); setOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-foreground/5 transition-colors ${!value ? "bg-primary/10 text-primary" : "text-muted-foreground"
              }`}
          >
            <div className="w-7 h-7 rounded-lg bg-muted border border-border flex items-center justify-center shrink-0">
              <Paintbrush className="w-3.5 h-3.5" />
            </div>
            <span className="font-medium">{unassignedLabel}</span>
          </button>

          {designers.length > 0 && <div className="border-t border-border" />}

          {designers.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => { onChange(d.id); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-foreground/5 transition-colors ${value === d.id ? "bg-primary/10" : ""
                }`}
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${value === d.id
                ? "bg-accent/30 border border-accent/40 text-accent"
                : "bg-accent/20 border border-accent/30 text-accent"
                }`}>
                {d.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className={`text-sm font-medium truncate ${value === d.id ? "text-primary" : "text-foreground"}`}>{d.full_name}</p>
                <p className="text-[11px] text-muted-foreground">@{d.username}</p>
              </div>
              {value === d.id && <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function NewTicketDrawer({ open, onClose, onCreated, designers }: { open: boolean; onClose: () => void; onCreated: () => void; designers: any[] }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const currentUser = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "{}") : {};

  const reset = () => {
    setTitle(""); setDescription(""); setPrice(""); setAssignedTo("");
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
        assigned_to: assignedTo || null,
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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
            onClick={handleClose}
          />
          {/* Drawer */}
          <motion.div
            key="drawer"
            initial={{ x: "100%", opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 40 }}
            className="fixed right-0 top-0 h-full w-full max-w-xl bg-background/80 backdrop-blur-3xl border-l border-border/50 z-[70] flex flex-col shadow-[-20px_0_40px_-10px_rgba(0,0,0,0.5)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-border/50 bg-background/40">
              <div>
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">New Ticket</h2>
                <p className="text-sm text-muted-foreground mt-1">Create a new design ticket</p>
              </div>
              <button onClick={handleClose} className="p-2.5 rounded-xl hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all duration-300 pointer-events-auto">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8 custom-scrollbar">
              {/* Created By */}
              <div className="group">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3 px-1">Created By</label>
                <div className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-white/[0.02] border border-white/5 shadow-inner transition-colors group-hover:bg-white/[0.04]">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 border border-white/10 flex items-center justify-center font-bold text-foreground shadow-sm shrink-0">
                    {currentUser.full_name?.charAt(0)?.toUpperCase() || "A"}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground/90">{currentUser.full_name || "Admin"}</p>
                    <p className="text-xs text-muted-foreground capitalize font-medium">{currentUser.role}</p>
                  </div>
                </div>
              </div>

              {/* Assign To Designer */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3 px-1">Assign to Designer</label>
                <div className="relative z-50">
                  <DesignerPicker
                    designers={designers.filter(d => d.role === "designer")}
                    value={assignedTo}
                    onChange={setAssignedTo}
                    unassignedLabel="Unassigned (Pending)"
                  />
                </div>
                {assignedTo && (
                  <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-primary mt-2 ml-1 flex items-center gap-1.5 font-medium">
                    <UserPlus className="w-3.5 h-3.5" /> Status will be set to <strong className="font-bold underline underline-offset-2">Assigned</strong>
                  </motion.p>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3 px-1 flex justify-between">
                  <span>Title <span className="text-destructive">*</span></span>
                </label>
                <input
                  value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Design new banner for campaign"
                  className="w-full px-5 py-4 rounded-2xl bg-background/50 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all text-sm shadow-inner"
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3 px-1">Price (USD)</label>
                <div className="relative group/price">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within/price:text-primary transition-colors font-medium">$</span>
                  <input
                    type="number" min="0" step="0.01"
                    value={price} onChange={e => setPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-9 pr-5 py-4 rounded-2xl bg-background/50 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all text-sm shadow-inner font-mono text-base"
                  />
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3 px-1">Reference Image</label>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
                {imagePreview ? (
                  <div className="relative rounded-2xl overflow-hidden border border-border/50 group shadow-md bg-black/20">
                    <img src={imagePreview} alt="preview" className="w-full max-h-60 object-contain" />
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-4">
                      <button onClick={() => fileRef.current?.click()} className="px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white text-sm font-semibold transition-all hover:scale-105 active:scale-95 shadow-lg">
                        Change
                      </button>
                      <button onClick={() => { setImageFile(null); setImagePreview(null); }} className="px-5 py-2.5 bg-destructive/20 hover:bg-destructive/40 border border-destructive/30 rounded-xl text-destructive-foreground text-sm font-semibold transition-all hover:scale-105 active:scale-95 shadow-lg">
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="w-full py-12 rounded-2xl border-2 border-dashed border-border/60 hover:border-primary/50 bg-white/[0.01] hover:bg-primary/[0.03] transition-all duration-300 flex flex-col items-center gap-4 text-muted-foreground hover:text-primary group shadow-inner"
                  >
                    <div className="w-14 h-14 rounded-full bg-white/[0.03] group-hover:bg-primary/20 border border-white/5 flex items-center justify-center transition-colors shadow-sm group-hover:scale-110 duration-300 group-hover:shadow-[0_0_15px_rgba(var(--primary),0.3)]">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-foreground/80 group-hover:text-primary transition-colors">Click to upload image</p>
                      <p className="text-[11px] mt-1.5 opacity-70 tracking-wide font-medium">JPG, PNG, GIF, WEBP</p>
                    </div>
                  </button>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3 px-1 flex justify-between">
                  <span>Description <span className="text-destructive">*</span></span>
                </label>
                <textarea
                  value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Describe what needs to be designed, any references, colors, style..."
                  rows={6}
                  className="w-full px-5 py-4 rounded-2xl bg-background/50 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all text-sm resize-none shadow-inner"
                />
              </div>

              {error && (
                <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-8 py-5 border-t border-border/50 bg-background/40 backdrop-blur-md flex items-center justify-between gap-4 mt-auto">
              <div className="flex items-center gap-2.5 text-xs text-muted-foreground bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                <span className={`w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor] ${assignedTo ? "bg-blue-400 text-blue-400" : "bg-amber-400 text-amber-400"}`}></span>
                <span className="font-semibold uppercase tracking-wide">{assignedTo ? "Assigned" : "Pending"}</span>
              </div>
              <div className="flex gap-3">
                <button onClick={handleClose} className="px-6 py-3 rounded-xl border border-border/60 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all">
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || success}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white text-sm font-bold hover:from-primary/90 hover:to-accent/90 disabled:opacity-50 disabled:grayscale transition-all flex items-center gap-2.5 shadow-[0_0_20px_rgba(var(--primary),0.4)] hover:shadow-[0_0_30px_rgba(var(--primary),0.6)] hover:-translate-y-0.5 active:translate-y-0"
                >
                  {success ? <><CheckCircle2 className="w-5 h-5 drop-shadow-sm" /> Created!</>
                    : loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Creating...</>
                      : <><Upload className="w-5 h-5 drop-shadow-sm" /> Create</>}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function AssignModal({ ticket, designers, onClose, onAssigned }: { ticket: any; designers: any[]; onClose: () => void; onAssigned: () => void }) {
  const [selectedDesigner, setSelectedDesigner] = useState(ticket.assigned_to || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.patch(`/tickets/${ticket.id}/assign`, { assigned_to: selectedDesigner || null });
      onAssigned();
      onClose();
    } catch (e: any) {
      setError(e.response?.data?.detail || "Failed to assign ticket");
    } finally {
      setLoading(false);
    }
  };

  const designerList = designers.filter(d => d.role === "designer");

  return (
    <AnimatePresence>
      <motion.div
        key="assign-backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      />
      <motion.div
        key="assign-modal"
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div className="w-full max-w-md bg-background/80 backdrop-blur-2xl border border-border/50 rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] pointer-events-auto overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-7 py-6 border-b border-border/50 bg-white/[0.02]">
            <div>
              <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center shadow-inner">
                  <UserPlus className="w-4 h-4 text-primary" />
                </div>
                Assign Ticket
              </h2>
              <p className="text-sm text-muted-foreground mt-1.5 truncate max-w-[280px] font-medium">{ticket.title}</p>
            </div>
            <button onClick={onClose} className="p-2.5 rounded-xl hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all duration-300">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="px-7 py-7 space-y-6">
            {/* Current status info */}
            <div className="flex items-center justify-between px-5 py-4 rounded-2xl bg-white/[0.03] border border-white/5 text-sm shadow-inner group">
              <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[11px]">Current Status</span>
              <span className="font-bold text-foreground/90 uppercase tracking-widest text-xs px-2.5 py-1 rounded bg-black/20 border border-white/5">{ticket.status.replace("_", " ")}</span>
            </div>

            {/* Designer select */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3 px-1">Select Designer</label>
              <DesignerPicker
                designers={designerList}
                value={selectedDesigner}
                onChange={setSelectedDesigner}
                unassignedLabel="Unassigned (Open)"
              />
              {selectedDesigner && selectedDesigner !== ticket.assigned_to && ticket.status === "pending" && (
                <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-primary mt-2.5 ml-1 flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Status will change to <strong className="font-bold underline underline-offset-2">Assigned</strong>
                </motion.p>
              )}
            </div>

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2 mt-2">
                    <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-7 py-5 border-t border-border/50 bg-white/[0.01] flex items-center justify-end gap-3">
            <button onClick={onClose} className="px-6 py-2.5 rounded-xl border border-border/60 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-white text-sm font-bold hover:to-primary disabled:opacity-50 transition-all flex items-center gap-2.5 shadow-[0_0_15px_rgba(var(--primary),0.3)] hover:shadow-[0_0_25px_rgba(var(--primary),0.5)] hover:-translate-y-0.5 active:translate-y-0"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><UserPlus className="w-4 h-4 drop-shadow-sm" /> {selectedDesigner ? "Assign" : "Unassign"}</>}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function AdminView() {
  const [stats, setStats] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [designers, setDesigners] = useState<any[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [assigningTicket, setAssigningTicket] = useState<any | null>(null);

  // Map designer id -> full_name for quick display
  const designerMap = Object.fromEntries(designers.map(d => [d.id, d.full_name]));

  useEffect(() => {
    fetchStats();
    fetchTickets();
    fetchDesigners();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get("/analytics/overview");
      setStats(res.data);
    } catch (e) {
      console.error("Failed to load stats", e);
    }
  };

  const fetchDesigners = async () => {
    try {
      const res = await api.get("/users");
      setDesigners(res.data);
    } catch (e) {
      console.error("Failed to load designers", e);
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
        designers={designers}
      />

      {assigningTicket && (
        <AssignModal
          ticket={assigningTicket}
          designers={designers}
          onClose={() => setAssigningTicket(null)}
          onAssigned={() => { fetchTickets(); fetchStats(); setAssigningTicket(null); }}
        />
      )}

      <div className="flex justify-between items-center bg-background/40 backdrop-blur-xl p-6 rounded-[2rem] border border-border/50 shadow-2xl z-10 relative">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">Overview</h2>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Welcome back, here's what's happening today.</p>
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 px-6 py-3 rounded-2xl font-semibold text-white shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 flex items-center gap-2 hover:-translate-y-0.5 active:translate-y-0"
        >
          <Plus className="w-5 h-5 drop-shadow-md" />
          <span>New Ticket</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 relative z-10">
        {statCards.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.5, type: "spring", stiffness: 100 }}
            className="p-6 rounded-[2rem] glass-panel relative overflow-hidden group hover:-translate-y-1 hover:shadow-2xl transition-all duration-500 will-change-transform"
          >
            {/* Animated Glow on Hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <div className="absolute top-0 right-0 p-5 opacity-20 group-hover:opacity-40 group-hover:scale-110 transition-all duration-500">
              <card.icon className="w-20 h-20" />
            </div>

            <div className="relative z-10 flex flex-col justify-between h-full">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl bg-background/50 backdrop-blur-md border border-border/50 flex items-center justify-center shadow-inner`}>
                  <card.icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <h3 className="text-sm font-semibold text-muted-foreground group-hover:text-foreground/80 transition-colors uppercase tracking-wider">{card.title}</h3>
              </div>

              <div className={`text-5xl font-bold mt-6 tracking-tighter bg-clip-text text-transparent bg-gradient-to-br ${card.color.replace('text-', 'from-').replace('-400', '-300').concat(' to-foreground/80')} drop-shadow-sm`}>
                {card.value}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Tickets Table */}
      <div className="rounded-[2rem] glass-panel p-8 relative z-10 shadow-2xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">Recent Assignments</h3>
            <p className="text-sm text-muted-foreground mt-1">Latest tickets across all designers.</p>
          </div>
          <button className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground bg-background/40 hover:bg-background/80 border border-border/50 hover:text-foreground transition-all duration-300">View All</button>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-border/40 bg-background/20 backdrop-blur-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/50 text-muted-foreground text-xs uppercase tracking-wider bg-background/40">
                <th className="py-5 font-semibold px-6 rounded-tl-2xl">Ticket Info</th>
                <th className="py-5 font-semibold px-6">Status</th>
                <th className="py-5 font-semibold px-6">Price</th>
                <th className="py-5 font-semibold px-6">Assignee</th>
                <th className="py-5 font-semibold px-6 text-right rounded-tr-2xl">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {tickets.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground bg-background/10">No tickets found.</td>
                </tr>
              )}
              {tickets.slice(0, 10).map((ticket) => (
                <tr key={ticket.id} className="hover:bg-white/[0.03] transition-colors group cursor-default">
                  <td className="py-5 px-6">
                    <div className="flex items-center gap-4">
                      {ticket.image_url ? (
                        <div className="relative w-12 h-12 rounded-xl border border-white/10 overflow-hidden shadow-md group-hover:shadow-lg transition-shadow">
                          <img src={ticket.image_url} alt="" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-xl border border-white/10 bg-background/50 flex items-center justify-center shadow-md">
                          <Activity className="w-5 h-5 text-muted-foreground/50" />
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-foreground group-hover:text-primary transition-colors">{ticket.title}</div>
                        <div className="text-xs text-muted-foreground mt-1 truncate max-w-[250px]">{ticket.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-5 px-6">
                    <span className="px-3 py-1.5 rounded-xl text-xs font-bold border border-white/5 shadow-sm backdrop-blur-md inline-block uppercase tracking-wide"
                      style={{
                        backgroundColor:
                          ticket.status === 'completed' ? 'rgba(74, 222, 128, 0.15)' :
                            ticket.status === 'review' ? 'rgba(250, 204, 21, 0.15)' :
                              ticket.status === 'in_progress' ? 'rgba(96, 165, 250, 0.15)' : 'rgba(161,161,170,0.15)',
                        color:
                          ticket.status === 'completed' ? '#4ade80' :
                            ticket.status === 'review' ? '#facc15' :
                              ticket.status === 'in_progress' ? '#60a5fa' : '#a1a1aa'
                      }}
                    >
                      {ticket.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-5 px-6 font-semibold text-foreground/90">${ticket.price}</td>
                  <td className="py-5 px-6 text-sm">
                    {ticket.assigned_to ? (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 border border-white/10 flex items-center justify-center text-foreground font-bold shadow-inner">
                          {designerMap[ticket.assigned_to]?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <span className="text-foreground font-medium">{designerMap[ticket.assigned_to] || "Unknown"}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic bg-background/50 px-3 py-1.5 rounded-lg border border-border/50 text-xs">Unassigned</span>
                    )}
                  </td>
                  <td className="py-5 px-6 text-right">
                    <div className="relative flex items-center justify-end gap-2">
                      <button
                        onClick={() => setAssigningTicket(ticket)}
                        className="px-4 py-2 rounded-xl bg-primary/10 hover:bg-primary border border-primary/20 hover:border-primary text-primary hover:text-white text-xs font-bold transition-all duration-300 flex items-center gap-2 opacity-0 group-hover:opacity-100 shadow-lg"
                      >
                        <UserPlus className="w-4 h-4" />
                        {ticket.assigned_to ? "Reassign" : "Assign"}
                      </button>
                    </div>
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
