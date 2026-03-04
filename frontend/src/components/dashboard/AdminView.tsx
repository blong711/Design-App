"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { Plus, DollarSign, Activity, FileCheck, AlertCircle, X, Upload, ImageIcon, Loader2, CheckCircle2, UserPlus, ChevronDown, Paintbrush, Calendar, Filter, Check, Clock, AlertTriangle } from "lucide-react";
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

function NewDesignDrawer({ open, onClose, onCreated, designers }: { open: boolean; onClose: () => void; onCreated: () => void; designers: any[] }) {
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
        const r = await api.post("/s3/upload/design-image", fd, { headers: { "Content-Type": "multipart/form-data" } });
        image_url = r.data.public_url;
      }
      await api.post("/designs/", {
        title: title.trim(),
        description: description.trim(),
        price: parseFloat(price) || 0,
        image_url,
        assigned_to: assignedTo || null,
      });
      setSuccess(true);
      setTimeout(() => { handleClose(); onCreated(); }, 1200);
    } catch (e: any) {
      setError(e.response?.data?.detail || "Failed to create design");
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
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 35 }}
            className="fixed right-0 top-0 h-full w-full max-w-lg bg-background border-l border-border z-[70] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <div>
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">New Design</h2>
                <p className="text-sm text-muted-foreground mt-1">Create a new design assignment</p>
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

              {/* Assign To Designer */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Assign to Designer</label>
                <DesignerPicker
                  designers={designers.filter(d => d.role === "designer")}
                  value={assignedTo}
                  onChange={setAssignedTo}
                  unassignedLabel="Unassigned (Pending)"
                />
                {assignedTo && (
                  <p className="text-xs text-primary mt-1.5 flex items-center gap-1">
                    <UserPlus className="w-3 h-3" /> Status will be set to <strong>Assigned</strong> automatically
                  </p>
                )}
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
                <span className={`w-2 h-2 rounded-full ${assignedTo ? "bg-blue-400" : "bg-amber-400"}`}></span>
                Status: <span className="font-medium text-foreground">{assignedTo ? "Assigned" : "Pending"}</span>
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

function AssignModal({ design, designers, onClose, onAssigned }: { design: any; designers: any[]; onClose: () => void; onAssigned: () => void }) {
  const [selectedDesigner, setSelectedDesigner] = useState(design.assigned_to || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.patch(`/designs/${design.id}/assign`, { assigned_to: selectedDesigner || null });
      onAssigned();
      onClose();
    } catch (e: any) {
      setError(e.response?.data?.detail || "Failed to assign design");
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
        <div className="w-full max-w-md bg-background border border-border rounded-2xl shadow-2xl pointer-events-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-border">
            <div>
              <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center shadow-inner">
                  <UserPlus className="w-4 h-4 text-primary" />
                </div>
                Assign Design
              </h2>
              <p className="text-sm text-muted-foreground mt-1.5 truncate max-w-[280px] font-medium">{design.title}</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-foreground/5 transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-6 space-y-4">
            {/* Current status info */}
            <div className="flex items-center justify-between px-5 py-4 rounded-2xl bg-white/[0.03] border border-white/5 text-sm shadow-inner group">
              <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[11px]">Current Status</span>
              <span className="font-bold text-foreground/90 uppercase tracking-widest text-xs px-2.5 py-1 rounded bg-black/20 border border-white/5">{design.status.replace("_", " ")}</span>
            </div>

            {/* Designer select */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Select Designer</label>
              <DesignerPicker
                designers={designerList}
                value={selectedDesigner}
                onChange={setSelectedDesigner}
                unassignedLabel="Unassigned"
              />
              {selectedDesigner && selectedDesigner !== design.assigned_to && design.status === "pending" && (
                <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-primary mt-2.5 ml-1 flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Status will change to <strong className="font-bold underline underline-offset-2">Assigned</strong>
                </motion.p>
              )}
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3">
            <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-all">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-all flex items-center gap-2 shadow-lg shadow-primary/30"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><UserPlus className="w-4 h-4" /> {selectedDesigner ? "Assign" : "Unassign"}</>}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function AdminView() {
  const [stats, setStats] = useState<any>(null);
  const [designs, setDesigns] = useState<any[]>([]);
  const [designers, setDesigners] = useState<any[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [assigningDesign, setAssigningDesign] = useState<any | null>(null);
  const [user, setUser] = useState<any>(null);

  // Filter & UI state
  const [timeFilter, setTimeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("");
  const [hoveredStatus, setHoveredStatus] = useState<string | null>(null);
  const [selectedDesigner, setSelectedDesigner] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");

  const tickets = designs;

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  // Map designer id -> full_name for quick display
  const designerMap = Object.fromEntries(designers.map(d => [d.id, d.full_name]));

  useEffect(() => {
    fetchStats();
    fetchDesigns();
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
      let allDesigners = res.data;

      // Managers and Admins see all designers

      setDesigners(allDesigners);
    } catch (e) {
      console.error("Failed to load designers", e);
    }
  };

  const fetchDesigns = async () => {
    try {
      const res = await api.get("/designs");
      setDesigns(res.data);
    } catch (e) {
      console.error("Failed to load designs", e);
    }
  };

  // Filter tickets by time range
  const getFilteredTicketsByTime = (allTickets: any[]) => {
    if (timeFilter === 'all') return allTickets;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return allTickets.filter(ticket => {
      const ticketDate = new Date(ticket.created_at);

      switch (timeFilter) {
        case 'today':
          return ticketDate >= startOfToday;
        case 'week':
          return ticketDate >= startOfWeek;
        case 'month':
          return ticketDate >= startOfMonth;
        default:
          return true;
      }
    });
  };

  const filteredTickets = getFilteredTicketsByTime(tickets);

  // Calculate revenue this month from completed tickets
  const calculateRevenueThisMonth = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return filteredTickets
      .filter(ticket => {
        if (ticket.status !== 'completed') return false;

        const completionDate = ticket.completed_at || ticket.updated_at;
        if (!completionDate) return false;

        const ticketDate = new Date(completionDate);
        return ticketDate.getMonth() === currentMonth && ticketDate.getFullYear() === currentYear;
      })
      .reduce((sum, ticket) => sum + (parseFloat(ticket.price) || 0), 0);
  };

  // Calculate status distribution for pie chart
  const getStatusDistribution = () => {
    const distribution = {
      pending: 0,
      in_progress: 0,
      review: 0,
      completed: 0,
      assigned: 0
    };

    filteredTickets.forEach(ticket => {
      if (distribution.hasOwnProperty(ticket.status)) {
        distribution[ticket.status as keyof typeof distribution]++;
      }
    });

    // Calculate total price for each status
    const statusRevenue = {
      pending: 0,
      in_progress: 0,
      review: 0,
      completed: 0,
      assigned: 0
    };

    filteredTickets.forEach(ticket => {
      if (statusRevenue.hasOwnProperty(ticket.status)) {
        statusRevenue[ticket.status as keyof typeof statusRevenue] += parseFloat(ticket.price) || 0;
      }
    });

    // Calculate average time in status
    const statusTimes = {
      pending: [] as number[],
      in_progress: [] as number[],
      review: [] as number[],
      completed: [] as number[],
      assigned: [] as number[]
    };

    filteredTickets.forEach(ticket => {
      if (ticket.updated_at && statusTimes.hasOwnProperty(ticket.status)) {
        const now = new Date();
        const updatedDate = new Date(ticket.updated_at);
        const daysDiff = Math.floor((now.getTime() - updatedDate.getTime()) / (1000 * 60 * 60 * 24));
        statusTimes[ticket.status as keyof typeof statusTimes].push(daysDiff);
      }
    });

    const getAvgTime = (times: number[]) => {
      if (times.length === 0) return 0;
      return Math.round(times.reduce((a, b) => a + b, 0) / times.length);
    };

    return [
      {
        label: 'Pending',
        value: distribution.pending + distribution.assigned,
        color: '#a1a1aa',
        percentage: 0,
        revenue: statusRevenue.pending + statusRevenue.assigned,
        avgDays: getAvgTime([...statusTimes.pending, ...statusTimes.assigned]),
        status: 'pending'
      },
      {
        label: 'In Progress',
        value: distribution.in_progress,
        color: '#60a5fa',
        percentage: 0,
        revenue: statusRevenue.in_progress,
        avgDays: getAvgTime(statusTimes.in_progress),
        status: 'in_progress'
      },
      {
        label: 'Review',
        value: distribution.review,
        color: '#facc15',
        percentage: 0,
        revenue: statusRevenue.review,
        avgDays: getAvgTime(statusTimes.review),
        status: 'review'
      },
      {
        label: 'Completed',
        value: distribution.completed,
        color: '#4ade80',
        percentage: 0,
        revenue: statusRevenue.completed,
        avgDays: getAvgTime(statusTimes.completed),
        status: 'completed'
      },
    ].map(item => {
      const total = filteredTickets.length || 1;
      return { ...item, percentage: Math.round((item.value / total) * 100) };
    });
  };

  const revenueThisMonth = calculateRevenueThisMonth();
  const statusDistribution = getStatusDistribution();
  const totalTickets = filteredTickets.length;

  // Calculate designer performance metrics
  const getDesignerPerformance = () => {
    const designerStats: Record<string, {
      id: string;
      name: string;
      completed: number;
      unpaid: number;
      totalEarned: number;
      thisMonth: number;
    }> = {};

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    designers.filter(d => d.role === "designer").forEach(designer => {
      designerStats[designer.id] = {
        id: designer.id,
        name: designer.full_name,
        completed: 0,
        unpaid: 0,
        totalEarned: 0,
        thisMonth: 0,
      };
    });

    tickets.forEach(ticket => {
      if (!ticket.assigned_to || !designerStats[ticket.assigned_to]) return;

      const stats = designerStats[ticket.assigned_to];
      const price = parseFloat(ticket.price) || 0;

      if (ticket.status === 'completed') {
        stats.completed++;
        stats.totalEarned += price;

        if (ticket.payment_status === 'unpaid') {
          stats.unpaid += price;
        }

        // Check if completed this month
        const completionDate = ticket.completed_at || ticket.updated_at;
        if (completionDate) {
          const ticketDate = new Date(completionDate);
          if (ticketDate.getMonth() === currentMonth && ticketDate.getFullYear() === currentYear) {
            stats.thisMonth += price;
          }
        }
      }
    });

    return Object.values(designerStats);
  };

  // Get filtered unpaid tickets for debt section
  const getFilteredUnpaidTickets = () => {
    return tickets.filter(ticket => {
      // Filter by completed and unpaid
      if (ticket.status !== 'completed' || ticket.payment_status === 'paid') return false;

      // Filter by designer
      if (selectedDesigner && ticket.assigned_to !== selectedDesigner) return false;

      // Filter by month
      if (selectedMonth) {
        const completionDate = ticket.completed_at || ticket.updated_at;
        if (completionDate) {
          const ticketDate = new Date(completionDate);
          const [year, month] = selectedMonth.split('-');
          if (ticketDate.getFullYear() !== parseInt(year) ||
            ticketDate.getMonth() !== parseInt(month) - 1) {
            return false;
          }
        } else {
          return false; // No completion date, can't filter by month
        }
      }

      return true;
    });
  };

  // Mark tickets as paid
  const handleMarkAsPaid = async () => {
    const unpaidTickets = getFilteredUnpaidTickets();
    if (unpaidTickets.length === 0) return;

    try {
      await Promise.all(
        unpaidTickets.map(ticket =>
          api.patch(`/tickets/${ticket.id}`, { payment_status: 'paid' })
        )
      );
      fetchTickets();
      fetchStats();
    } catch (e) {
      console.error("Failed to mark tickets as paid", e);
    }
  };

  const designerPerformance = getDesignerPerformance();
  const filteredUnpaidTickets = getFilteredUnpaidTickets();
  const totalUnpaidAmount = filteredUnpaidTickets.reduce((sum, t) => sum + (parseFloat(t.price) || 0), 0);

  // Generate month options (last 12 months)
  const getMonthOptions = () => {
    const options: { value: string; label: string }[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      options.push({ value, label });
    }
    return options;
  };

  const monthOptions = getMonthOptions();

  // Calculate overdue tickets based on status duration
  const getOverdueTickets = () => {
    const now = new Date();
    const overdueList: Array<{
      ticket: any;
      daysInStatus: number;
      threshold: number;
      severity: 'warning' | 'danger';
    }> = [];

    tickets.forEach(ticket => {
      let threshold = 0;
      let statusDate = ticket.updated_at ? new Date(ticket.updated_at) : null;

      // Define thresholds for different statuses
      if (ticket.status === 'in_progress') {
        threshold = 7; // 7 days for in_progress
      } else if (ticket.status === 'review') {
        threshold = 3; // 3 days for review
      } else if (ticket.status === 'assigned') {
        threshold = 2; // 2 days to start work
      } else if (ticket.status === 'pending') {
        threshold = 5; // 5 days unassigned
      }

      if (threshold > 0 && statusDate) {
        const daysDiff = Math.floor((now.getTime() - statusDate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysDiff > threshold) {
          const overdueDays = daysDiff - threshold;
          overdueList.push({
            ticket,
            daysInStatus: daysDiff,
            threshold,
            severity: overdueDays > threshold ? 'danger' : 'warning'
          });
        }
      }
    });

    // Sort by most overdue first
    return overdueList.sort((a, b) =>
      (b.daysInStatus - b.threshold) - (a.daysInStatus - a.threshold)
    );
  };

  const overdueTickets = getOverdueTickets();

  // Check if a ticket is overdue
  const isTicketOverdue = (ticket: any) => {
    return overdueTickets.some(ot => ot.ticket.id === ticket.id);
  };

  // Get overdue info for a ticket
  const getTicketOverdueInfo = (ticket: any) => {
    return overdueTickets.find(ot => ot.ticket.id === ticket.id);
  };

  const statCards = [
    { title: "Total Designs", value: stats?.total_designs || 0, icon: Activity, color: "text-blue-400" },
    { title: "Completed", value: stats?.completed_designs || 0, icon: FileCheck, color: "text-green-400" },
    { title: "To Pay (Debt)", value: `$${stats?.total_unpaid || 0}`, icon: AlertCircle, color: "text-red-400" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in zoom-in duration-500">
      <NewDesignDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onCreated={() => { fetchStats(); fetchDesigns(); }}
        designers={designers}
      />

      {assigningDesign && (
        <AssignModal
          design={assigningDesign}
          designers={designers}
          onClose={() => setAssigningDesign(null)}
          onAssigned={() => { fetchDesigns(); fetchStats(); setAssigningDesign(null); }}
        />
      )}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            Overview
          </h2>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Welcome back, here's what's happening today.
          </p>
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          className="bg-primary hover:bg-primary/90 px-5 py-2.5 rounded-xl font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5 drop-shadow-md" />
          <span>New Design</span>
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

      {/* Recent Designs Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="rounded-[2rem] glass-panel p-8 relative z-10 shadow-2xl"
      >
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">Recent Assignments</h3>
            <p className="text-sm text-muted-foreground mt-1">Latest designs across all designers.</p>
          </div>
        </div>

        {/* Active Filter Badge */}
        {statusFilter && (
          <div className="mb-4 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Filtered by:</span>
            <button
              onClick={() => setStatusFilter('')}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
            >
              {statusFilter.replace('_', ' ')}
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        <div className="flex flex-col lg:flex-row items-center gap-8">
          {/* Pie Chart */}
          <div className="relative w-64 h-64 shrink-0">
            <svg viewBox="0 0 200 200" className="transform -rotate-90">
              {(() => {
                let cumulativePercent = 0;
                return statusDistribution.map((item, index) => {
                  const startPercent = cumulativePercent;
                  cumulativePercent += item.percentage;
                  const endPercent = cumulativePercent;

                  // Calculate arc path
                  const startAngle = (startPercent / 100) * 2 * Math.PI;
                  const endAngle = (endPercent / 100) * 2 * Math.PI;
                  const largeArcFlag = endPercent - startPercent > 50 ? 1 : 0;

                  const startX = 100 + 80 * Math.cos(startAngle);
                  const startY = 100 + 80 * Math.sin(startAngle);
                  const endX = 100 + 80 * Math.cos(endAngle);
                  const endY = 100 + 80 * Math.sin(endAngle);

                  const pathData = item.percentage > 0
                    ? `M 100 100 L ${startX} ${startY} A 80 80 0 ${largeArcFlag} 1 ${endX} ${endY} Z`
                    : '';

                  const isSelected = statusFilter === item.status;
                  const isHovered = hoveredStatus === item.status;

                  return (
                    <g key={item.label}>
                      <motion.path
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{
                          opacity: isSelected || isHovered ? 1 : (statusFilter ? 0.3 : 1),
                          scale: isSelected || isHovered ? 1.05 : 1
                        }}
                        transition={{ delay: 0.6 + index * 0.1, duration: 0.3, type: "spring" }}
                        d={pathData}
                        fill={item.color}
                        className="transition-all cursor-pointer"
                        style={{ transformOrigin: 'center' }}
                        onClick={() => setStatusFilter(statusFilter === item.status ? '' : item.status)}
                        onMouseEnter={() => setHoveredStatus(item.status)}
                        onMouseLeave={() => setHoveredStatus(null)}
                      />

                      {/* Percentage label inside segment */}
                      {item.percentage > 5 && (
                        <text
                          x={100 + 55 * Math.cos((startAngle + endAngle) / 2)}
                          y={100 + 55 * Math.sin((startAngle + endAngle) / 2)}
                          className="text-[10px] font-bold pointer-events-none"
                          fill="white"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          transform={`rotate(90, ${100 + 55 * Math.cos((startAngle + endAngle) / 2)}, ${100 + 55 * Math.sin((startAngle + endAngle) / 2)})`}
                        >
                          {item.percentage}%
                        </text>
                      )}
                    </g>
                  );
                });
              })()}

              {/* Center circle for donut effect */}
              <circle cx="100" cy="100" r="50" fill="var(--background)" />
            </svg>

            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="text-3xl font-bold text-foreground">{totalTickets}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">
                {timeFilter === 'all' ? 'Total' : timeFilter === 'today' ? 'Today' : timeFilter === 'week' ? 'This Week' : 'This Month'}
              </div>
            </div>
          </div>

          {/* Legend with interactive stats */}
          <div className="flex-1 grid grid-cols-2 gap-4">
            {statusDistribution.map((item, index) => {
              const isSelected = statusFilter === item.status;
              const isHovered = hoveredStatus === item.status;

              return (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.1, duration: 0.5 }}
                  onClick={() => setStatusFilter(statusFilter === item.status ? '' : item.status)}
                  onMouseEnter={() => setHoveredStatus(item.status)}
                  onMouseLeave={() => setHoveredStatus(null)}
                  className={`flex items-start gap-3 p-3 rounded-lg transition-all cursor-pointer border ${isSelected
                    ? 'bg-foreground/10 border-primary shadow-lg'
                    : isHovered
                      ? 'bg-foreground/5 border-foreground/20'
                      : 'bg-transparent border-transparent hover:bg-foreground/5'
                    }`}
                >
                  <div
                    className="w-4 h-4 rounded-sm shrink-0 mt-0.5"
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{item.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.value} ticket{item.value !== 1 ? 's' : ''} ({item.percentage}%)
                    </div>

                    {/* Tooltip info on hover */}
                    {(isHovered || isSelected) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-2 pt-2 border-t border-border/50 space-y-1"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Avg. time:</span>
                          <span className="font-medium text-foreground">{item.avgDays} days</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Total value:</span>
                          <span className="font-semibold text-emerald-400">${item.revenue.toFixed(2)}</span>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {isSelected && (
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Recent Tickets Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="rounded-2xl glass-panel p-6"
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-semibold">Recent Assignments</h3>
            {statusFilter && (
              <p className="text-sm text-muted-foreground mt-1">
                Showing <span className="text-primary font-medium">{statusFilter.replace('_', ' ')}</span> tickets
              </p>
            )}
          </div>
          <button className="text-sm text-primary hover:text-primary-foreground underline underline-offset-4 transition-colors">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/50 text-muted-foreground text-xs uppercase tracking-wider bg-background/40">
                <th className="py-5 font-semibold px-6 rounded-tl-2xl">Design Info</th>
                <th className="py-5 font-semibold px-6">Status</th>
                <th className="py-5 font-semibold px-6">Price</th>
                <th className="py-5 font-semibold px-6">Assignee</th>
                <th className="py-5 font-semibold px-6 text-right rounded-tr-2xl">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {designs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground bg-background/10">No designs found.</td>
                </tr>
              )}
              {designs.slice(0, 10).map((design) => (
                <tr key={design.id} className="hover:bg-white/[0.03] transition-colors group cursor-default">
                  <td className="py-5 px-6">
                    <div className="flex items-center gap-4">
                      {design.image_url ? (
                        <div className="relative w-12 h-12 rounded-xl border border-white/10 overflow-hidden shadow-md group-hover:shadow-lg transition-shadow">
                          <img src={design.image_url} alt="" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-xl border border-white/10 bg-background/50 flex items-center justify-center shadow-md">
                          <Activity className="w-5 h-5 text-muted-foreground/50" />
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-foreground group-hover:text-primary transition-colors">{design.title}</div>
                        <div className="text-xs text-muted-foreground mt-1 truncate max-w-[250px]">{design.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="px-3 py-1 rounded-full text-xs font-medium border border-border"
                      style={{
                        backgroundColor:
                          design.status === 'completed' ? 'rgba(74, 222, 128, 0.15)' :
                            design.status === 'review' ? 'rgba(250, 204, 21, 0.15)' :
                              design.status === 'in_progress' ? 'rgba(96, 165, 250, 0.15)' : 'rgba(161,161,170,0.15)',
                        color:
                          design.status === 'completed' ? '#4ade80' :
                            design.status === 'review' ? '#facc15' :
                              design.status === 'in_progress' ? '#60a5fa' : '#a1a1aa'
                      }}
                    >
                      {design.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-5 px-6 font-semibold text-foreground/90">${design.price}</td>
                  <td className="py-5 px-6 text-sm">
                    {design.assigned_to ? (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 border border-white/10 flex items-center justify-center text-foreground font-bold shadow-inner">
                          {designerMap[design.assigned_to]?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <span className="text-foreground font-medium">{designerMap[design.assigned_to] || "Unknown"}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic">Unassigned</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="relative flex items-center justify-end gap-2">
                      <button
                        onClick={() => setAssigningDesign(design)}
                        className="px-4 py-2 rounded-xl bg-primary/10 hover:bg-primary border border-primary/20 hover:border-primary text-primary hover:text-white text-xs font-bold transition-all duration-300 flex items-center gap-2 opacity-0 group-hover:opacity-100 shadow-lg"
                      >
                        <UserPlus className="w-4 h-4" />
                        {design.assigned_to ? "Reassign" : "Assign"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Overdue/Aging Tickets Section */}
      {overdueTickets.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="rounded-2xl glass-panel p-6 border-2 border-amber-500/30 bg-amber-500/5"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">Overdue Tickets</h3>
              <p className="text-sm text-muted-foreground">{overdueTickets.length} ticket{overdueTickets.length !== 1 ? 's' : ''} need{overdueTickets.length === 1 ? 's' : ''} attention</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-sm">
                  <th className="pb-4 font-medium px-4">Ticket</th>
                  <th className="pb-4 font-medium px-4">Status</th>
                  <th className="pb-4 font-medium px-4">Assignee</th>
                  <th className="pb-4 font-medium px-4 text-center">Days in Status</th>
                  <th className="pb-4 font-medium px-4 text-center">Threshold</th>
                  <th className="pb-4 font-medium px-4 text-right">Overdue By</th>
                </tr>
              </thead>
              <tbody>
                {overdueTickets.map(({ ticket, daysInStatus, threshold, severity }) => (
                  <tr key={ticket.id} className="border-b border-border hover:bg-foreground/5 transition-colors group">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        {ticket.image_url && (
                          <img src={ticket.image_url} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0 border border-border" />
                        )}
                        <div>
                          <div className="font-semibold text-foreground flex items-center gap-2">
                            {ticket.title}
                            {severity === 'danger' && (
                              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="Critical" />
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 truncate max-w-[200px]">{ticket.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-3 py-1 rounded-full text-xs font-medium border border-border"
                        style={{
                          backgroundColor:
                            ticket.status === 'review' ? 'rgba(250, 204, 21, 0.1)' :
                              ticket.status === 'in_progress' ? 'rgba(96, 165, 250, 0.1)' :
                                ticket.status === 'assigned' ? 'rgba(168, 85, 247, 0.1)' : 'rgba(128,128,128,0.1)',
                          color:
                            ticket.status === 'review' ? '#facc15' :
                              ticket.status === 'in_progress' ? '#60a5fa' :
                                ticket.status === 'assigned' ? '#a855f7' : '#a1a1aa'
                        }}
                      >
                        {ticket.status.replace("_", " ").toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm">
                      {ticket.assigned_to ? (
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary text-xs font-bold">
                            {designerMap[ticket.assigned_to]?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <span className="text-foreground font-medium">{designerMap[ticket.assigned_to] || "Unknown"}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="font-semibold text-foreground">{daysInStatus}</span>
                        <span className="text-xs text-muted-foreground">days</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="text-sm text-muted-foreground">{threshold} days</span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className={`font-bold text-lg ${severity === 'danger' ? 'text-red-400' : 'text-amber-400'}`}>
                        +{daysInStatus - threshold} days
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary Stats */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-foreground/5 border border-border">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Pending</div>
              <div className="text-2xl font-bold text-gray-400">
                {overdueTickets.filter(t => t.ticket.status === 'pending').length}
              </div>
              <div className="text-xs text-muted-foreground mt-1">&gt; 5 days</div>
            </div>
            <div className="p-4 rounded-xl bg-foreground/5 border border-border">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Assigned</div>
              <div className="text-2xl font-bold text-purple-400">
                {overdueTickets.filter(t => t.ticket.status === 'assigned').length}
              </div>
              <div className="text-xs text-muted-foreground mt-1">&gt; 2 days</div>
            </div>
            <div className="p-4 rounded-xl bg-foreground/5 border border-border">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">In Progress</div>
              <div className="text-2xl font-bold text-blue-400">
                {overdueTickets.filter(t => t.ticket.status === 'in_progress').length}
              </div>
              <div className="text-xs text-muted-foreground mt-1">&gt; 7 days</div>
            </div>
            <div className="p-4 rounded-xl bg-foreground/5 border border-border">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Review</div>
              <div className="text-2xl font-bold text-amber-400">
                {overdueTickets.filter(t => t.ticket.status === 'review').length}
              </div>
              <div className="text-xs text-muted-foreground mt-1">&gt; 3 days</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Performance Designer Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="rounded-2xl glass-panel p-6"
      >
        <h3 className="text-xl font-semibold mb-6">Performance Designer</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-sm">
                <th className="pb-4 font-medium px-4">Designer</th>
                <th className="pb-4 font-medium px-4 text-center">Completed</th>
                <th className="pb-4 font-medium px-4 text-right">Unpaid</th>
                <th className="pb-4 font-medium px-4 text-right">Total Earned</th>
                <th className="pb-4 font-medium px-4 text-right">This Month</th>
              </tr>
            </thead>
            <tbody>
              {designerPerformance.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">No designers found.</td>
                </tr>
              )}
              {designerPerformance.map((designer) => (
                <tr key={designer.id} className="border-b border-border hover:bg-foreground/5 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary text-xs font-bold">
                        {designer.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-foreground">{designer.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-sm font-semibold">
                      {designer.completed}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span className={`font-semibold ${designer.unpaid > 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
                      ${designer.unpaid.toFixed(2)}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span className="font-semibold text-emerald-400">
                      ${designer.totalEarned.toFixed(2)}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span className="font-medium text-blue-400">
                      ${designer.thisMonth.toFixed(2)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Debt Management Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.5 }}
        className="rounded-2xl glass-panel p-6"
      >
        <h3 className="text-xl font-semibold mb-6">Debt Management</h3>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Month Filter */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              <Calendar className="w-3 h-3 inline mr-1" /> Filter by Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-foreground/5 border border-border text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all text-sm"
            >
              <option value="">All Months</option>
              {monthOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {/* Designer Filter */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              <Filter className="w-3 h-3 inline mr-1" /> Select Designer
            </label>
            <select
              value={selectedDesigner}
              onChange={(e) => setSelectedDesigner(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-foreground/5 border border-border text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all text-sm"
            >
              <option value="">All Designers</option>
              {designers.filter(d => d.role === "designer").map(designer => (
                <option key={designer.id} value={designer.id}>{designer.full_name}</option>
              ))}
            </select>
          </div>

          {/* Summary Card */}
          <div className="flex flex-col justify-center p-4 rounded-xl bg-red-500/10 border border-red-500/30">
            <div className="text-xs text-red-300 uppercase tracking-wider mb-1">Total Unpaid</div>
            <div className="text-2xl font-bold text-red-400">${totalUnpaidAmount.toFixed(2)}</div>
            <div className="text-xs text-red-300 mt-1">{filteredUnpaidTickets.length} ticket{filteredUnpaidTickets.length !== 1 ? 's' : ''}</div>
          </div>
        </div>

        {/* Unpaid Tickets List */}
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-sm">
                <th className="pb-4 font-medium px-4">Ticket</th>
                <th className="pb-4 font-medium px-4">Designer</th>
                <th className="pb-4 font-medium px-4">Completed Date</th>
                <th className="pb-4 font-medium px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredUnpaidTickets.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-muted-foreground">
                    {selectedMonth || selectedDesigner ? 'No unpaid tickets match the filters.' : 'All tickets have been paid!'}
                  </td>
                </tr>
              )}
              {filteredUnpaidTickets.map((ticket) => (
                <tr key={ticket.id} className="border-b border-border hover:bg-foreground/5 transition-colors">
                  <td className="py-4 px-4">
                    <div className="font-semibold text-foreground">{ticket.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">ID: {ticket.id}</div>
                  </td>
                  <td className="py-4 px-4">
                    {ticket.assigned_to ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary text-xs font-bold">
                          {designerMap[ticket.assigned_to]?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <span className="text-sm text-foreground">{designerMap[ticket.assigned_to] || "Unknown"}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Unassigned</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-sm text-muted-foreground">
                    {(ticket.completed_at || ticket.updated_at) ? new Date(ticket.completed_at || ticket.updated_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    }) : 'N/A'}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span className="font-semibold text-red-400">${parseFloat(ticket.price || 0).toFixed(2)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mark as Paid Button */}
        {filteredUnpaidTickets.length > 0 && (
          <div className="flex justify-end">
            <button
              onClick={handleMarkAsPaid}
              className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold shadow-lg shadow-emerald-500/30 transition-all flex items-center gap-2"
            >
              <Check className="w-5 h-5" />
              Mark as Paid ({filteredUnpaidTickets.length} ticket{filteredUnpaidTickets.length !== 1 ? 's' : ''})
            </button>
          </div>
        )}
      </motion.div>


    </div>
  );
}
