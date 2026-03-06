"use client";

import { useState } from "react";
import { X, Loader2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";

export default function DepositModal({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
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
