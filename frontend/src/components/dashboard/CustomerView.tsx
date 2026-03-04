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
    Eye
} from "lucide-react";
import { useToast } from "@/lib/toast";
import DesignDetailDrawer from "@/components/dashboard/DesignDetailDrawer";
import NewDesignDrawer from "@/components/dashboard/NewDesignDrawer";
import { getTimeAgo } from "@/lib/date-utils";

export default function CustomerView({ user: initialUser }: { user: any }) {
    const toast = useToast();
    const [user, setUser] = useState(initialUser);
    const [designs, setDesigns] = useState<any[]>([]);
    const [deposits, setDeposits] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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
            setDesigns(designsRes.data);
            setDeposits(depositsRes.data);
            setTransactions(transactionsRes.data);
            setUser(userRes.data);
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
            <div className="space-y-8 animate-in fade-in duration-500">
                {/* Header & Balance */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Customer Dashboard</h2>
                        <p className="text-muted-foreground mt-1 text-sm">Welcome! Manage your designs and balance here.</p>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-panel p-1 rounded-2xl flex items-center gap-1"
                    >
                        <div className="px-6 py-3 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                <Wallet className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Balance</p>
                                <p className="text-2xl font-bold text-primary">${user.balance?.toFixed(2) || "0.00"}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsDepositOpen(true)}
                            className="h-full px-4 rounded-xl bg-primary hover:bg-primary/80 text-primary-foreground font-bold transition-all shadow-lg shadow-primary/20"
                        >
                            Deposit
                        </button>
                    </motion.div>
                </div>

                {/* Stats Summary */}
                <div className="grid gap-6 md:grid-cols-3">
                    {[
                        { title: "Total Designs", value: designs.length, icon: ImageIcon, color: "text-blue-400" },
                        { title: "Active Projects", value: designs.filter(d => !['completed', 'canceled'].includes(d.status)).length, icon: Clock, color: "text-amber-400" },
                        { title: "Completed", value: designs.filter(d => d.status === 'completed').length, icon: CheckCircle2, color: "text-green-400" },
                    ].map((stat, i) => (
                        <motion.div
                            key={stat.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="p-6 rounded-2xl glass-panel relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <stat.icon className="w-16 h-16" />
                            </div>
                            <h3 className="text-sm font-medium text-muted-foreground">{stat.title}</h3>
                            <div className={`text-3xl font-bold mt-2 ${stat.color}`}>{stat.value}</div>
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
                                onClick={() => setIsNewDesignOpen(true)}
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
                                        onClick={() => setIsNewDesignOpen(true)}
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
                                        onClick={() => setDetailDesignId(design.id)}
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
                                            <h4 className="font-bold text-foreground truncate">{design.title}</h4>
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
                                <div className="divide-y divide-white/5 max-h-[300px] overflow-y-auto">
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
                                <div className="divide-y divide-white/5 max-h-[300px] overflow-y-auto">
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


function DepositModal({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!amount || parseFloat(amount) <= 0) return;
        setLoading(true);
        try {
            await api.post("/deposits", { amount: parseFloat(amount) });
            onSuccess();
            onClose();
            setAmount("");
        } catch (e: any) {
            setError(e.response?.data?.detail || "Failed to submit request");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="w-full max-w-md bg-background border border-border rounded-[2rem] p-8 relative shadow-2xl"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-foreground">Deposit Funds</h3>
                            <button onClick={onClose} className="p-2 hover:bg-foreground/5 rounded-lg transition-colors">
                                <X className="w-5 h-5 text-muted-foreground" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-500 flex gap-3 text-sm">
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                <p>After submitting, an admin will verify your payment and approve the funds to your account.</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Amount (USD)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold text-lg">$</span>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full bg-muted border border-border rounded-2xl pl-10 pr-4 py-4 text-xl font-bold focus:border-primary outline-none transition-all text-foreground"
                                    />
                                </div>
                            </div>

                            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                            <button
                                disabled={loading || !amount}
                                onClick={handleSubmit}
                                className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100"
                            >
                                {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : "Submit Request"}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
