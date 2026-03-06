"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { Filter, Search, X, ChevronDown, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { formatVietnamDate } from "@/lib/date-utils";
import DesignDetailDrawer from "@/components/dashboard/DesignDetailDrawer";
import NewDesignDrawer from "@/components/dashboard/NewDesignDrawer";
import DesignerView from "@/components/dashboard/DesignerView";
import CustomerView from "@/components/dashboard/CustomerView";

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

const ALL_STATUSES = ["pending", "assigned", "in_progress", "review", "completed"] as const;
const ALL_PAYMENTS = ["paid", "unpaid"] as const;

export default function DesignsPage() {
  const [designs, setDesigns] = useState<any[]>([]);
  const [userMap, setUserMap] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDesignId, setSelectedDesignId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isNewDesignOpen, setIsNewDesignOpen] = useState(false);

  // Filter state
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [paymentFilter, setPaymentFilter] = useState<string[]>([]);
  const filterRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const fetchDesigns = async () => {
    try {
      const res = await api.get("/designs");
      setDesigns(res.data);
    } catch (e) {
      console.error("Failed to fetch designs", e);
    }
  };

  useEffect(() => {
    Promise.all([
      api.get("/designs"),
      api.get("/users").catch(() => ({ data: [] })),
    ]).then(([designRes, userRes]) => {
      setDesigns(designRes.data);
      const map: Record<string, User> = {};
      (userRes.data as User[]).forEach((u) => { map[u.id] = u; });
      setUserMap(map);

      const userStr = localStorage.getItem("user");
      if (userStr) setCurrentUser(JSON.parse(userStr));
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleStatus = (s: string) => {
    setPage(1);
    setStatusFilter((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  };

  const togglePayment = (p: string) => {
    setPage(1);
    setPaymentFilter((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);
  };

  const clearFilters = () => { setStatusFilter([]); setPaymentFilter([]); setPage(1); };

  const activeFilterCount = statusFilter.length + paymentFilter.length;

  // For customer: payment is "paid" if design has been assigned (balance already deducted), else "unpaid"
  const getCustomerPaymentStatus = (design: any) =>
    design.assigned_to ? "paid" : "unpaid";

  const filtered = designs.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      t.title?.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q) ||
      (t.assigned_to && userMap[t.assigned_to]?.full_name.toLowerCase().includes(q));

    const matchStatus = statusFilter.length === 0 || statusFilter.includes(t.status);

    let matchPayment = true;
    if (paymentFilter.length > 0) {
      if (currentUser?.role === "customer") {
        matchPayment = paymentFilter.includes(getCustomerPaymentStatus(t));
      } else {
        matchPayment = paymentFilter.includes(t.payment_status);
      }
    }

    return matchSearch && matchStatus && matchPayment;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset page when search or filters change
  useEffect(() => { setPage(1); }, [search, statusFilter, paymentFilter]);

  if (loading) return <div className="animate-pulse text-muted-foreground py-10">Loading designs...</div>;

  if (currentUser?.role === "designer" || currentUser?.role === "admin") {
    return <DesignerView user={currentUser} />;
  }

  if (currentUser?.role === "customer") {
    return <CustomerView user={currentUser} initialView="dashboard" />;
  }

  return (
    <>
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">All Designs</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {filtered.length} design{filtered.length !== 1 ? "s" : ""} · Manage, filter, and review all design assignments.
            </p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            {currentUser?.role === 'customer' && (
              <button
                onClick={() => setIsNewDesignOpen(true)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Plus className="w-5 h-5" /> New Design
              </button>
            )}

            {/* Search */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search designs or assignee..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-muted border border-border rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
              />
            </div>

            {/* Filter button + dropdown */}
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => setFilterOpen((o) => !o)}
                className={`relative bg-muted hover:bg-muted/80 border px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 text-foreground transition-colors ${activeFilterCount > 0 ? "border-primary text-primary" : "border-border"
                  }`}
              >
                <Filter className="w-4 h-4" />
                Filter
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${filterOpen ? "rotate-180" : ""}`} />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Dropdown panel */}
              {filterOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-64 bg-background border border-border rounded-2xl shadow-2xl shadow-black/40 p-4 space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">Filters</span>
                    {activeFilterCount > 0 && (
                      <button
                        onClick={clearFilters}
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                      >
                        <X className="w-3 h-3" /> Clear all
                      </button>
                    )}
                  </div>

                  {/* Status */}
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Status</p>
                    <div className="flex flex-wrap gap-2">
                      {ALL_STATUSES.map((s) => {
                        const style = STATUS_STYLE[s];
                        const active = statusFilter.includes(s);
                        return (
                          <button
                            key={s}
                            onClick={() => toggleStatus(s)}
                            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all capitalize ${active
                              ? "border-current opacity-100"
                              : "border-border opacity-50 hover:opacity-80"
                              }`}
                            style={{ backgroundColor: style.bg, color: style.color }}
                          >
                            {s.replace(/_/g, " ")}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Payment filter – hidden for designers */}
                  {currentUser?.role !== "designer" && (
                    <>
                      {/* Divider */}
                      <div className="border-t border-border" />

                      {/* Payment */}
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Payment</p>
                        <div className="flex gap-2">
                          {ALL_PAYMENTS.map((p) => {
                            const active = paymentFilter.includes(p);
                            return (
                              <button
                                key={p}
                                onClick={() => togglePayment(p)}
                                className={`flex-1 py-1.5 rounded-xl text-xs font-semibold border transition-all capitalize ${p === "paid"
                                  ? active
                                    ? "bg-green-500/20 text-green-400 border-green-500/50"
                                    : "bg-green-500/5 text-green-400/50 border-green-500/20 hover:opacity-80"
                                  : active
                                    ? "bg-red-500/20 text-red-400 border-red-500/50"
                                    : "bg-red-500/5 text-red-400/50 border-red-500/20 hover:opacity-80"
                                  }`}
                              >
                                {p}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Active filter chips */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-muted-foreground">Active filters:</span>
            {statusFilter.map((s) => (
              <span
                key={s}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border border-border bg-foreground/5 text-foreground capitalize"
              >
                {s.replace(/_/g, " ")}
                <button onClick={() => toggleStatus(s)} className="hover:text-red-400 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {paymentFilter.map((p) => (
              <span
                key={p}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border capitalize ${p === "paid"
                  ? "bg-green-500/10 text-green-400 border-green-500/30"
                  : "bg-red-500/10 text-red-400 border-red-500/30"
                  }`}
              >
                {p}
                <button onClick={() => togglePayment(p)} className="hover:opacity-70 transition-opacity">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Table */}
        <div className="rounded-2xl glass-panel shadow-xl shadow-black/20 overflow-hidden">
          <div className="overflow-x-auto min-h-[500px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                  <th className="pb-4 pt-5 font-semibold px-5">Design</th>
                  <th className="pb-4 pt-5 font-semibold px-5">Status</th>
                  {currentUser?.role !== "customer" && (
                    <th className="pb-4 pt-5 font-semibold px-5">Assignee</th>
                  )}
                  {currentUser?.role !== "designer" && (
                    <th className="pb-4 pt-5 font-semibold px-5">Payment</th>
                  )}
                  {currentUser?.role !== "designer" && (
                    <th className="pb-4 pt-5 font-semibold px-5">Price</th>
                  )}
                  <th className="pb-4 pt-5 font-semibold px-5 text-right">Created At</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-muted-foreground">
                      {search || activeFilterCount > 0
                        ? "No designs match the current filters."
                        : "No designs found."}
                    </td>
                  </tr>
                )}
                {paginated.map((design) => {
                  const assignee = design.assigned_to ? userMap[design.assigned_to] : null;
                  const statusStyle = STATUS_STYLE[design.status] ?? STATUS_STYLE.pending;

                  return (
                    <tr
                      key={design.id}
                      onClick={() => setSelectedDesignId(design.id)}
                      className="border-b border-border hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      {/* Design */}
                      <td className="py-4 px-5 w-1/3">
                        <div className="font-semibold text-foreground">{design.title}</div>
                        <div className="text-xs text-muted-foreground mt-1 truncate max-w-[250px]">{design.description}</div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-5">
                        <span
                          className="px-3 py-1 rounded-full text-xs font-medium border border-border capitalize"
                          style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}
                        >
                          {design.status.replace(/_/g, " ")}
                        </span>
                      </td>

                      {/* Assignee */}
                      {currentUser?.role !== "customer" && (
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
                      )}

                      {/* Payment – role-based display */}
                      {currentUser?.role === "customer" && (() => {
                        const pStatus = getCustomerPaymentStatus(design);
                        return (
                          <td className="py-4 px-5">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${pStatus === "paid"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400"
                              }`}>
                              {pStatus.toUpperCase()}
                            </span>
                          </td>
                        );
                      })()}
                      {currentUser?.role === "admin" && (
                        <td className="py-4 px-5">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${design.payment_status === "paid"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                            }`}>
                            {design.payment_status?.toUpperCase()}
                          </span>
                        </td>
                      )}

                      {/* Price */}
                      {currentUser?.role !== "designer" && (
                        <td className="py-4 px-5 font-medium text-foreground">${design.price}</td>
                      )}

                      {/* Created At */}
                      <td className="py-4 px-5 text-right text-xs text-muted-foreground">
                        {formatVietnamDate(design.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-muted-foreground">
              Showing{" "}
              <span className="font-semibold text-foreground">{(page - 1) * PAGE_SIZE + 1}</span>
              {"–"}
              <span className="font-semibold text-foreground">{Math.min(page * PAGE_SIZE, filtered.length)}</span>
              {" of "}
              <span className="font-semibold text-foreground">{filtered.length}</span> designs
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-border bg-foreground/5 hover:bg-foreground/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const startPage = Math.max(1, Math.min(page - 2, totalPages - 4));
                const p = startPage + i;
                if (p > totalPages) return null;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 flex items-center justify-center rounded-lg border text-sm font-semibold transition-all ${page === p ? "bg-primary border-primary text-white shadow-md shadow-primary/30" : "border-border bg-foreground/5 hover:bg-foreground/10 text-foreground"}`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-border bg-foreground/5 hover:bg-foreground/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <DesignDetailDrawer
        designId={selectedDesignId}
        onClose={() => setSelectedDesignId(null)}
        currentUser={currentUser}
        onUpdate={fetchDesigns}
      />

      <NewDesignDrawer
        open={isNewDesignOpen}
        onClose={() => setIsNewDesignOpen(false)}
        onCreated={fetchDesigns}
      />
    </>
  );
}
