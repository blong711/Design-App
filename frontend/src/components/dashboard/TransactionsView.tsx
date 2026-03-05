"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
    Wallet,
    ArrowUpRight,
    ArrowDownLeft,
    Search,
    Filter,
    Loader2,
    Download,
    User as UserIcon,
    Clock,
    DollarSign
} from "lucide-react";
import { motion } from "framer-motion";
import { formatVietnamDateTime } from "@/lib/date-utils";

interface Transaction {
    id: string;
    user_id: string;
    amount: number;
    type: string;
    reference_id?: string;
    description: string;
    created_at: string;
    user_email?: string;
    user_full_name?: string;
}

export default function TransactionsView({ isAdmin = false }: { isAdmin?: boolean }) {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");

    const fetchTransactions = async () => {
        try {
            const res = await api.get("/transactions");
            setTransactions(res.data);
        } catch (e) {
            console.error("Failed to fetch transactions", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    const filteredTransactions = transactions.filter(tx => {
        const matchesSearch = tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tx.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tx.user_full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tx.id.includes(searchQuery);
        const matchesType = typeFilter === "all" || tx.type === typeFilter;
        return matchesSearch && matchesType;
    });

    const formatDate = (dateString: string) => {
        return formatVietnamDateTime(dateString);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">Loading transaction history...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Transaction History</h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                        {isAdmin ? "Monitor all financial activities across the platform." : "Manage your deposits and payments here."}
                    </p>
                </div>
            </div>

            {/* Filters & Tools */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search by description, ID or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-muted border border-border rounded-2xl focus:border-primary outline-none transition-all text-foreground"
                    />
                </div>
                <div>
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="w-full px-4 py-3 bg-muted border border-border rounded-2xl focus:border-primary outline-none transition-all appearance-none cursor-pointer text-foreground"
                    >
                        <option value="all" className="bg-background">All Types</option>
                        <option value="deposit" className="bg-background">Deposits</option>
                        <option value="design_payment" className="bg-background">Design Payments</option>
                    </select>
                </div>
                <button className="flex items-center justify-center gap-2 px-6 py-3 bg-foreground/5 hover:bg-foreground/10 border border-white/5 rounded-2xl transition-all font-bold text-sm">
                    <Download className="w-4 h-4" /> Export CSV
                </button>
            </div>

            {/* Transactions Table/List */}
            <div className="glass-panel rounded-[2rem] overflow-hidden border border-border shadow-2xl bg-card">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-muted/50 border-b border-border">
                                <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-muted-foreground">Status / Type</th>
                                <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-muted-foreground">Description</th>
                                {isAdmin && <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-muted-foreground">User</th>}
                                <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-muted-foreground">Amount</th>
                                <th className="px-6 py-5 text-xs font-bold uppercase tracking-widest text-muted-foreground text-right">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={isAdmin ? 5 : 4} className="px-6 py-20 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center gap-3">
                                            <Wallet className="w-12 h-12 opacity-20" />
                                            <p className="font-medium text-lg">No transactions found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredTransactions.map((tx) => (
                                    <motion.tr
                                        key={tx.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="group hover:bg-white/[0.02] transition-colors"
                                    >
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.amount > 0 ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                                    }`}>
                                                    {tx.amount > 0 ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold uppercase tracking-tighter">
                                                        {tx.type.replace('_', ' ')}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground font-medium truncate max-w-[80px]">#{tx.id.slice(-8)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-foreground">{tx.description}</span>
                                                <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                                    {tx.reference_id && <><Clock className="w-3 h-3" /> Ref: {tx.reference_id}</>}
                                                </span>
                                            </div>
                                        </td>
                                        {isAdmin && (
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-[10px] shrink-0">
                                                        {tx.user_full_name?.charAt(0).toUpperCase() || "U"}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-sm font-bold text-foreground truncate">
                                                            {tx.user_full_name || "Unknown User"}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground truncate">
                                                            {tx.user_email || tx.user_id}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                        )}
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-1 font-bold">
                                                <span className={tx.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-rose-600 dark:text-rose-400'}>
                                                    {tx.amount > 0 ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <span className="text-xs font-medium text-muted-foreground">{formatDate(tx.created_at)}</span>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
