"use client";

import { useEffect, useState, useRef } from "react";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus,
    Wallet,
    History,
    Clock,
    CheckCircle2,
    AlertCircle,
    Image as ImageIcon,
    X,
    Loader2,
    ArrowUpRight,
    Eye,
    LayoutGrid,
    List,
    ChevronLeft,
    ChevronRight,
    MessageSquare,
    DollarSign
} from "lucide-react";
import { useToast } from "@/lib/toast";
import DesignDetailDrawer from "@/components/dashboard/DesignDetailDrawer";
import NewDesignDrawer from "@/components/dashboard/NewDesignDrawer";
import { getTimeAgo } from "@/lib/date-utils";
import DepositModal from "@/components/dashboard/DepositModal";

function ActivityIcon(props: any) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
    );
}

const COLUMNS = [
    { id: "assigned", title: "To Do", icon: Clock, color: "text-blue-400" },
    { id: "in_progress", title: "In Progress", icon: ActivityIcon, color: "text-purple-400" },
    { id: "review", title: "In Review", icon: Eye, color: "text-amber-400" },
    { id: "completed", title: "Completed", icon: CheckCircle2, color: "text-green-400" },
];

const LIST_PAGE_SIZE = 9; // 3x3 grid

export default function CustomerView({ user: initialUser, initialView = "overview" }: { user: any; initialView?: "overview" | "dashboard" }) {
    const toast = useToast();
    const [user, setUser] = useState(initialUser);
    const [designs, setDesigns] = useState<any[]>([]);
    const [deposits, setDeposits] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // View modes
    const [currentView, setCurrentView] = useState<"overview" | "dashboard">(initialView);
    const [viewMode, setViewMode] = useState<"kanban" | "cart">("kanban");
    const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
    const [viewedDesignIds, setViewedDesignIds] = useState<Set<string>>(new Set());

    // Load viewedDesignIds from localStorage
    useEffect(() => {
        if (typeof window !== 'undefined' && initialUser?.id) {
            const saved = localStorage.getItem(`viewedDesignIds_customer_${initialUser.id}`);
            if (saved) setViewedDesignIds(new Set(JSON.parse(saved)));
        }
    }, [initialUser?.id]);

    // Save viewedDesignIds to localStorage on change
    useEffect(() => {
        if (typeof window !== 'undefined' && initialUser?.id) {
            localStorage.setItem(`viewedDesignIds_customer_${initialUser.id}`, JSON.stringify(Array.from(viewedDesignIds)));
        }
    }, [viewedDesignIds, initialUser?.id]);

    // Kanban columns
    const [columns, setColumns] = useState<Record<string, any[]>>({
        assigned: [],
        in_progress: [],
        review: [],
        completed: []
    });
    const [columnPages, setColumnPages] = useState<Record<string, number>>({
        assigned: 1,
        in_progress: 1,
        review: 1,
        completed: 1
    });

    // Modals/Drawers
    const [isNewDesignOpen, setIsNewDesignOpen] = useState(false);
    const [isDepositOpen, setIsDepositOpen] = useState(false);
    const [detailDesignId, setDetailDesignId] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            const [designsRes, depositsRes, transactionsRes, userRes] = await Promise.all([
                api.get("/designs"),
                api.get("/deposits"),
                api.get("/transactions"),
                api.get(`/users/${initialUser.id}`)
            ]);
            const designsData = designsRes.data;
            setDesigns(designsData);
            setDeposits(depositsRes.data);
            setTransactions(transactionsRes.data);
            setUser(userRes.data);

            // Group designs by status for kanban view
            const grouped: Record<string, any[]> = { assigned: [], in_progress: [], review: [], completed: [] };
            designsData.forEach((t: any) => {
                if (grouped[t.status]) {
                    grouped[t.status].push(t);
                } else {
                    grouped.assigned.push(t); // fallback
                }
            });
            setColumns(grouped);
        } catch (e) {
            console.error("Failed to fetch customer data", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [initialUser.id]);



    if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

    return (
        <>
            <div className="flex flex-col w-full">
                {/* Fixed Header */}
                <div className="flex-shrink-0 px-6 py-4 border-b border-border bg-background">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight">
                                {currentView === "overview" ? "Customer Dashboard" : "My Designs"}
                            </h2>
                            <p className="text-muted-foreground mt-1 text-sm">
                                {currentView === "overview"
                                    ? "Welcome! Manage your designs and balance here."
                                    : "Track and manage all your design projects"}
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsDepositOpen(true)}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 font-bold transition-all border border-emerald-500/20"
                            >
                                <Wallet className="w-5 h-5" />
                                Add Funds
                            </button>
                            <button
                                onClick={() => setIsNewDesignOpen(true)}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/80 text-primary-foreground font-bold transition-all shadow-lg shadow-primary/20"
                            >
                                <Plus className="w-5 h-5" />
                                New Design
                            </button>
                        </div>
                    </div>

                    {/* Dashboard View Controls */}
                    {currentView === "dashboard" && (
                        <div className="flex items-center justify-end gap-3 mt-4">
                            {/* View Mode Toggle */}
                            <div className="flex items-center gap-2 bg-foreground/5 rounded-full p-1 border border-border">
                                <button
                                    onClick={() => setViewMode("kanban")}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${viewMode === "kanban"
                                        ? "bg-primary text-primary-foreground shadow-lg"
                                        : "text-muted-foreground hover:text-foreground"
                                        }`}
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                    Kanban
                                </button>
                                <button
                                    onClick={() => setViewMode("cart")}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${viewMode === "cart"
                                        ? "bg-primary text-primary-foreground shadow-lg"
                                        : "text-muted-foreground hover:text-foreground"
                                        }`}
                                >
                                    <List className="w-4 h-4" />
                                    List
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Content Area */}
                <div className="flex-1">
                    {currentView === "overview" ? (
                        <OverviewContent
                            user={user}
                            designs={designs}
                            deposits={deposits}
                            transactions={transactions}
                            onNewDesign={() => setIsNewDesignOpen(true)}
                            onDeposit={() => setIsDepositOpen(true)}
                            onViewDesign={(id) => {
                                setViewedDesignIds(prev => new Set(prev).add(id));
                                setDetailDesignId(id);
                            }}
                            viewedDesignIds={viewedDesignIds}
                        />
                    ) : (
                        <DashboardContent
                            columns={columns}
                            viewMode={viewMode}
                            density={density}
                            columnPages={columnPages}
                            setColumnPages={setColumnPages}
                            onViewDesign={(id) => {
                                setViewedDesignIds(prev => new Set(prev).add(id));
                                setDetailDesignId(id);
                            }}
                            viewedDesignIds={viewedDesignIds}
                        />
                    )}
                </div>
            </div>

            {/* New Design Drawer */}
            <NewDesignDrawer
                open={isNewDesignOpen}
                onClose={() => setIsNewDesignOpen(false)}
                onCreated={() => fetchData()}
            />

            {/* Deposit Modal */}
            <DepositModal
                open={isDepositOpen}
                onClose={() => setIsDepositOpen(false)}
                onSuccess={() => fetchData()}
            />

            {/* Global Detail Drawer */}
            <DesignDetailDrawer
                designId={detailDesignId}
                onClose={() => setDetailDesignId(null)}
                currentUser={user}
                onUpdate={fetchData}
            />
        </>
    );
}

// Overview Content Component
function OverviewContent({
    user,
    designs,
    deposits,
    transactions,
    onNewDesign,
    onDeposit,
    onViewDesign,
    viewedDesignIds
}: {
    user: any;
    designs: any[];
    deposits: any[];
    transactions: any[];
    onNewDesign: () => void;
    onDeposit: () => void;
    onViewDesign: (id: string) => void;
    viewedDesignIds: Set<string>;
}) {
    return (
        <div className="space-y-8 px-6 py-4 animate-in fade-in duration-500">
            {/* Stats Summary */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                {[
                    { title: "Current Balance", value: `$${(user?.balance || 0).toFixed(2)}`, icon: Wallet, color: "text-emerald-400", action: onDeposit, actionLabel: "Top up" },
                    { title: "Total Designs", value: designs.length, icon: ImageIcon, color: "text-blue-400" },
                    { title: "Pending", value: designs.filter(d => d.status === 'pending').length, icon: Clock, color: "text-amber-400" },
                    { title: "Active", value: designs.filter(d => ['assigned', 'in_progress', 'review', 'needs_revision'].includes(d.status)).length, icon: ActivityIcon, color: "text-purple-400" },
                    { title: "Completed", value: designs.filter(d => d.status === 'completed').length, icon: CheckCircle2, color: "text-green-400" },
                    {
                        title: "Total Paid",
                        value: `$${Math.abs(transactions.filter(tx => ['design_payment', 'refund'].includes(tx.type)).reduce((acc, tx) => acc + tx.amount, 0)).toFixed(2)}`,
                        icon: DollarSign,
                        color: "text-rose-400"
                    },
                ].map((stat, i) => (
                    <motion.div
                        key={stat.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-4 rounded-2xl glass-panel relative overflow-hidden group border border-white/5"
                    >
                        <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                            <stat.icon className="w-12 h-12" />
                        </div>
                        <div className="flex justify-between items-start relative z-10">
                            <div>
                                <h3 className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{stat.title}</h3>
                                <div className={`text-xl font-bold mt-1 ${stat.color}`}>{stat.value}</div>
                            </div>
                            {stat.action && (
                                <button
                                    onClick={stat.action}
                                    className="p-1 px-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-tighter transition-all opacity-0 group-hover:opacity-100"
                                >
                                    {stat.actionLabel}
                                </button>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Main Content Areas */}
            <div className="grid gap-8 lg:grid-cols-3">
                {/* Recent Designs List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <ImageIcon className="w-5 h-5 text-primary" />
                            Your Designs
                        </h3>
                        <button
                            onClick={onNewDesign}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-foreground/10 hover:bg-foreground/20 text-sm font-bold transition-colors"
                        >
                            <Plus className="w-4 h-4" /> New Design
                        </button>
                    </div>

                    <div className="space-y-4">
                        {designs.length === 0 ? (
                            <div className="glass-panel p-12 text-center rounded-2xl">
                                <div className="w-16 h-16 rounded-full bg-foreground/5 flex items-center justify-center mx-auto mb-4">
                                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                                </div>
                                <h4 className="text-lg font-semibold text-foreground">No designs yet</h4>
                                <p className="text-muted-foreground text-sm mt-1">Start by requesting your first design!</p>
                                <button
                                    onClick={onNewDesign}
                                    className="mt-6 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold"
                                >
                                    Create Design
                                </button>
                            </div>
                        ) : (
                            designs.map((design, i) => (
                                <motion.div
                                    key={design.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    onClick={() => onViewDesign(design.id)}
                                    className="glass-panel p-4 rounded-2xl hover:bg-white/5 transition-all cursor-pointer group flex items-center gap-4 border border-white/5"
                                >
                                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-foreground/10 shrink-0 border border-border">
                                        {design.image_url ? (
                                            <img src={design.image_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <ImageIcon className="w-6 h-6 text-muted-foreground" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-foreground truncate">{design.title}</h4>
                                            {design.comment_count > 0 && !viewedDesignIds.has(design.id) && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-pink-500/20 border border-pink-500/30 shrink-0"
                                                >
                                                    <MessageSquare className="w-3 h-3 text-pink-400" />
                                                    <span className="text-xs font-bold text-pink-400">{design.comment_count}</span>
                                                </motion.div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter ${design.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                                                design.status === 'pending' ? 'bg-amber-500/20 text-amber-500' :
                                                    'bg-blue-500/20 text-blue-400'
                                                }`}>
                                                {design.status}
                                            </span>
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Clock className="w-3 h-3" /> {getTimeAgo(design.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right px-4 shrink-0">
                                        <p className="text-lg font-bold text-primary">${design.price || "---"}</p>
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{design.price > 0 ? "Approved" : "Pending Price"}</p>
                                    </div>
                                    <div className="p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity bg-primary/10">
                                        <Eye className="w-5 h-5 text-primary" />
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>

                {/* History Column */}
                <div className="space-y-8">
                    {/* Transaction History */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <ArrowUpRight className="w-5 h-5 text-primary" />
                                Transactions
                            </h3>
                        </div>

                        <div className="glass-panel rounded-2xl overflow-hidden border border-white/5">
                            <div className="p-4 border-b border-white/5 bg-white/5">
                                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Recent Activity</p>
                            </div>
                            <div className="divide-y divide-white/5">
                                {transactions.length === 0 ? (
                                    <div className="p-8 text-center text-muted-foreground text-sm">No transactions yet.</div>
                                ) : (
                                    transactions.map((tx) => (
                                        <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                                            <div className="min-w-0">
                                                <p className="font-bold text-foreground truncate text-sm">{tx.description}</p>
                                                <p className="text-[10px] text-muted-foreground">{getTimeAgo(tx.created_at)}</p>
                                            </div>
                                            <div className="text-right shrink-0 ml-4">
                                                <p className={`font-bold ${tx.amount > 0 ? 'text-green-400' : 'text-rose-400'}`}>
                                                    {tx.amount > 0 ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
                                                </p>
                                                <p className="text-[9px] uppercase font-bold tracking-tighter opacity-50">{tx.type.replace('_', ' ')}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Deposit History */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <History className="w-5 h-5 text-primary" />
                                Deposits
                            </h3>
                        </div>

                        <div className="glass-panel rounded-2xl overflow-hidden border border-white/5">
                            <div className="p-4 border-b border-white/5 bg-white/5">
                                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Recent Requests</p>
                            </div>
                            <div className="divide-y divide-white/5">
                                {deposits.length === 0 ? (
                                    <div className="p-8 text-center text-muted-foreground text-sm">No deposit requests yet.</div>
                                ) : (
                                    deposits.map((dep) => (
                                        <div key={dep.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                                            <div>
                                                <p className="font-bold text-foreground">${dep.amount.toFixed(2)}</p>
                                                <p className="text-[10px] text-muted-foreground">{getTimeAgo(dep.created_at)}</p>
                                            </div>
                                            <div>
                                                <span className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase ${dep.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                                                    dep.status === 'pending' ? 'bg-amber-500/20 text-amber-500' :
                                                        'bg-red-500/20 text-red-500'
                                                    }`}>
                                                    {dep.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}

// Dashboard Content Component (Read-only Kanban/List View)
function DashboardContent({
    columns,
    viewMode,
    density,
    columnPages,
    setColumnPages,
    onViewDesign,
    viewedDesignIds
}: {
    columns: Record<string, any[]>;
    viewMode: "kanban" | "cart";
    density: "comfortable" | "compact";
    columnPages: Record<string, number>;
    setColumnPages: (pages: Record<string, number>) => void;
    onViewDesign: (id: string) => void;
    viewedDesignIds: Set<string>;
}) {
    const [collapsedCols, setCollapsedCols] = useState<Set<string>>(new Set());
    const toggleCol = (id: string) => setCollapsedCols(prev => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
    });

    if (viewMode === "kanban") {
        return (
            <div className="flex gap-2 px-6 py-4 overflow-x-auto h-full">
                {COLUMNS.map((col, colIdx) => {
                    const isCollapsed = collapsedCols.has(col.id);
                    return isCollapsed ? (
                        // Collapsed column — narrow vertical strip
                        <div
                            key={col.id}
                            onClick={() => toggleCol(col.id)}
                            title={`Expand ${col.title}`}
                            className="shrink-0 flex flex-col items-center rounded-xl glass-panel border border-border cursor-pointer hover:border-primary/40 transition-all"
                            style={{ width: 44, order: 100 + colIdx }}
                        >
                            <div className="flex flex-col items-center gap-3 py-4 flex-1">
                                <col.icon className={`w-4 h-4 ${col.color}`} />
                                <span className="text-[10px] font-bold text-muted-foreground bg-foreground/10 w-6 h-6 rounded-full flex items-center justify-center shrink-0">
                                    {columns[col.id]?.length || 0}
                                </span>
                                <div className="flex-1 flex items-center justify-center mt-2">
                                    <span
                                        className="text-[10px] uppercase tracking-widest font-semibold text-foreground/50 whitespace-nowrap"
                                        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                                    >
                                        {col.title}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div key={col.id} className="flex flex-col rounded-xl glass-panel border border-border flex-1 min-w-[260px]" style={{ order: colIdx }}>
                            {/* Sticky Column Header */}
                            <div className="sticky top-0 z-10 px-4 py-3 bg-background/95 backdrop-blur-sm border-b border-border flex items-center justify-between">
                                <div className="flex items-center gap-2 font-semibold">
                                    <col.icon className={`w-4 h-4 ${col.color}`} />
                                    <span className="text-xs uppercase tracking-wider text-foreground/80">{col.title}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-muted-foreground bg-foreground/10 px-2 py-0.5 rounded-full">
                                        {columns[col.id]?.length || 0}
                                    </span>
                                    <button
                                        onClick={() => toggleCol(col.id)}
                                        title="Collapse column"
                                        className="w-5 h-5 flex items-center justify-center rounded hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                                    </button>
                                </div>
                            </div>

                            {/* Scrollable Cards Area */}
                            <div
                                className="overflow-y-auto custom-scrollbar p-2 flex flex-col gap-2"
                                style={{ height: 'calc(100vh - 220px)' }}
                            >
                                {columns[col.id]?.length === 0 ? (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                                        <col.icon className={`w-12 h-12 ${col.color} opacity-20 mb-3`} />
                                        <p className="text-muted-foreground text-xs font-medium mb-1">
                                            No tasks
                                        </p>
                                        <p className="text-xs text-muted-foreground/60">
                                            {col.id === 'assigned' && 'Waiting to start'}
                                            {col.id === 'in_progress' && 'In progress'}
                                            {col.id === 'review' && 'Under review'}
                                            {col.id === 'completed' && 'Completed'}
                                        </p>
                                    </div>
                                ) : (
                                    columns[col.id]?.map((design) => {
                                        const isCompact = density === "compact";
                                        const titleSize = isCompact ? "text-xs" : "text-sm";
                                        const badgeSize = isCompact ? "text-[10px]" : "text-xs";
                                        const imageHeight = isCompact ? "h-24" : "h-32";

                                        return (
                                            <div
                                                key={design.id}
                                                className="shrink-0 rounded-xl border border-border select-none transition-all cursor-pointer group overflow-hidden bg-card hover:border-primary/40 hover:shadow-md"
                                                onClick={() => onViewDesign(design.id)}
                                            >
                                                {/* Image - always render */}
                                                <div className={`relative w-full ${imageHeight} overflow-hidden bg-muted`}>
                                                    {design.image_url ? (
                                                        <img
                                                            src={design.image_url}
                                                            alt={design.title}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <LayoutGrid className="w-8 h-8 text-muted-foreground/20" />
                                                        </div>
                                                    )}
                                                    {/* Notification badges overlay */}
                                                    <div className="absolute top-2 right-2 flex gap-1">
                                                        {design.comment_count > 0 && !viewedDesignIds.has(design.id) && (
                                                            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-pink-500/90 backdrop-blur-sm">
                                                                <MessageSquare className="w-2.5 h-2.5 text-white" />
                                                                <span className="text-[9px] font-bold text-white">{design.comment_count}</span>
                                                            </div>
                                                        )}
                                                        {design.status !== 'assigned' && !viewedDesignIds.has(design.id) && (
                                                            <span className="px-1.5 py-0.5 rounded-full bg-blue-500/90 backdrop-blur-sm text-white text-[9px] font-black uppercase tracking-tighter animate-pulse">New</span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Content */}
                                                <div className={isCompact ? "p-2.5" : "p-3"}>
                                                    {/* Title */}
                                                    <h4 className={`font-semibold text-foreground leading-snug line-clamp-2 mb-2 ${titleSize}`} title={design.title}>
                                                        {design.title}
                                                    </h4>

                                                    {/* Price */}
                                                    {design.price > 0 && (
                                                        <p className={`text-primary font-bold mb-1 ${badgeSize}`}>
                                                            Price: {design.price.toFixed(2)}
                                                        </p>
                                                    )}

                                                    {/* Date */}
                                                    <p className={`text-muted-foreground mb-3 ${badgeSize}`}>
                                                        {new Date(design.updated_at || design.created_at).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                    </p>

                                                    {/* Bottom Row: Customer avatar left, Designer avatar right */}
                                                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                                                        {/* Customer */}
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="w-7 h-7 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center font-bold text-primary text-[10px] overflow-hidden">
                                                                {design.customer_avatar ? (
                                                                    <img src={design.customer_avatar} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    (design.customer_name || design.created_by_name || 'C')?.charAt(0).toUpperCase()
                                                                )}
                                                            </div>
                                                            <span className={`text-muted-foreground truncate max-w-[60px] ${badgeSize}`}>
                                                                {design.customer_name || design.created_by_name || 'Customer'}
                                                            </span>
                                                        </div>

                                                        {/* Designer */}
                                                        <div className="flex items-center gap-1.5">
                                                            <span className={`text-muted-foreground truncate max-w-[60px] text-right ${badgeSize}`}>
                                                                {design.designer_name || design.assigned_to_name || 'Unassigned'}
                                                            </span>
                                                            <div className="w-7 h-7 rounded-full bg-purple-500/20 border-2 border-purple-500/30 flex items-center justify-center font-bold text-purple-400 text-[10px] overflow-hidden">
                                                                {design.designer_avatar ? (
                                                                    <img src={design.designer_avatar} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    (design.designer_name || design.assigned_to_name || 'D')?.charAt(0).toUpperCase()
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    ); // end isCollapsed ternary
                })}
            </div>
        );
    }

    // List View
    return (
        <div className="space-y-4 px-6 py-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
            {COLUMNS.map(col => {
                const designs = columns[col.id] || [];
                if (designs.length === 0) return null;

                const currentPage = columnPages[col.id] || 1;
                const totalPages = Math.max(1, Math.ceil(designs.length / LIST_PAGE_SIZE));
                const startIndex = (currentPage - 1) * LIST_PAGE_SIZE;
                const endIndex = startIndex + LIST_PAGE_SIZE;
                const paginatedDesigns = designs.slice(startIndex, endIndex);

                return (
                    <div key={col.id} className="glass-panel rounded-2xl overflow-hidden">
                        {/* Section Header */}
                        <div className="px-6 py-4 border-b border-border bg-foreground/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <col.icon className={`w-5 h-5 ${col.color}`} />
                                <h3 className="font-semibold text-lg">{col.title}</h3>
                                <span className="text-xs font-bold text-muted-foreground bg-foreground/10 px-2.5 py-1 rounded-full">
                                    {designs.length}
                                </span>
                            </div>
                        </div>

                        {/* Design Cards */}
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {paginatedDesigns.map((design) => (
                                <motion.div
                                    key={design.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="rounded-xl border border-border bg-foreground/5 hover:bg-foreground/10 transition-all cursor-pointer group overflow-hidden"
                                    onClick={() => onViewDesign(design.id)}
                                >
                                    {/* Reference Image */}
                                    {design.image_url && (
                                        <div className="relative w-full h-48 overflow-hidden bg-background/50">
                                            <img
                                                src={design.image_url}
                                                alt={design.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                            {/* Status Badge Overlay */}
                                            <div className="absolute top-3 right-3">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-sm ${col.id === 'completed' ? 'bg-green-500/90 text-white' :
                                                    col.id === 'review' ? 'bg-amber-500/90 text-white' :
                                                        col.id === 'in_progress' ? 'bg-purple-500/90 text-white' :
                                                            'bg-blue-500/90 text-white'
                                                    }`}>
                                                    {col.title}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="p-4">
                                        {/* Title */}
                                        <h4 className="font-semibold text-foreground leading-tight group-hover:text-primary transition-colors mb-2 line-clamp-1">
                                            {design.title}
                                        </h4>

                                        {/* Description */}
                                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                            {design.description || 'No description provided'}
                                        </p>

                                        {/* Metadata Row */}
                                        <div className="flex items-center justify-between text-xs pt-3 border-t border-border/50">
                                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                                <Clock className="w-3.5 h-3.5" />
                                                <span>{getTimeAgo(design.updated_at || design.created_at)}</span>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex items-center gap-2">
                                                {design.result_link && (
                                                    <a
                                                        href={design.result_link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="text-blue-400 hover:text-blue-300 underline underline-offset-2 flex items-center gap-1 font-medium"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" /> View
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="px-6 py-4 border-t border-border bg-foreground/5 flex items-center justify-between">
                                <p className="text-sm text-muted-foreground">
                                    Showing{" "}
                                    <span className="font-semibold text-foreground">{startIndex + 1}</span>
                                    {"–"}
                                    <span className="font-semibold text-foreground">{Math.min(endIndex, designs.length)}</span>
                                    {" of "}
                                    <span className="font-semibold text-foreground">{designs.length}</span> tasks
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setColumnPages({ ...columnPages, [col.id]: Math.max(1, currentPage - 1) })}
                                        disabled={currentPage === 1}
                                        className="w-9 h-9 flex items-center justify-center rounded-lg border border-border bg-foreground/5 hover:bg-foreground/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        const startPage = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
                                        const p = startPage + i;
                                        if (p > totalPages) return null;
                                        return (
                                            <button
                                                key={p}
                                                onClick={() => setColumnPages({ ...columnPages, [col.id]: p })}
                                                className={`w-9 h-9 flex items-center justify-center rounded-lg border text-sm font-semibold transition-all ${currentPage === p
                                                    ? "bg-primary border-primary text-primary-foreground shadow-md shadow-primary/30"
                                                    : "border-border bg-foreground/5 hover:bg-foreground/10 text-foreground"
                                                    }`}
                                            >
                                                {p}
                                            </button>
                                        );
                                    })}
                                    <button
                                        onClick={() => setColumnPages({ ...columnPages, [col.id]: Math.min(totalPages, currentPage + 1) })}
                                        disabled={currentPage === totalPages}
                                        className="w-9 h-9 flex items-center justify-center rounded-lg border border-border bg-foreground/5 hover:bg-foreground/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}

            {Object.values(columns).every(col => col.length === 0) && (
                <div className="glass-panel rounded-2xl p-12 text-center">
                    <LayoutGrid className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
                    <p className="text-muted-foreground font-medium">No designs yet</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">Start by creating your first design</p>
                </div>
            )}
        </div>
    );
}

