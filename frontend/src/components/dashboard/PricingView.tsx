"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Package, Check, Sparkles, AlertCircle, ShoppingBag, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function PricingView() {
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const res = await api.get("/pricing");
            setTemplates(res.data);
        } catch (e) {
            console.error("Failed to fetch pricing", e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-12">
            {/* Hero Section */}
            <div className="relative rounded-[2.5rem] overflow-hidden bg-foreground/5 border border-border p-12 text-center">
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#fff_0%,transparent_100%)] opacity-20" />
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative z-10 max-w-2xl mx-auto"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest mb-6 shadow-xl">
                        <Sparkles className="w-3.5 h-3.5" />
                        Service Marketplace
                    </div>
                    <h1 className="text-5xl font-black text-foreground mb-6 tracking-tight">
                        Choose your perfect <br /> <span className="text-primary">Design Package</span>
                    </h1>
                    <p className="text-muted-foreground text-lg font-medium leading-relaxed">
                        Professional design services tailored to your business needs.
                        Select a package to start your next creative project instantly.
                    </p>
                </motion.div>
            </div>

            {/* Pricing Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
                {loading ? (
                    [1, 2, 3].map(i => (
                        <div key={i} className="h-[400px] rounded-[2rem] bg-foreground/5 animate-pulse" />
                    ))
                ) : templates.length === 0 ? (
                    <div className="col-span-full py-20 bg-foreground/5 rounded-[2rem] border border-dashed border-border flex flex-col items-center justify-center text-center">
                        <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
                        <h3 className="text-xl font-bold text-muted-foreground">No service packages available yet.</h3>
                    </div>
                ) : (
                    templates.map((t, idx) => (
                        <motion.div
                            key={t.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            whileHover={{ y: -10 }}
                            className="relative group flex flex-col rounded-[2.5rem] bg-gradient-to-b from-foreground/5 to-foreground/[0.02] border border-border overflow-hidden hover:border-primary/50 transition-all shadow-2xl shadow-black/5"
                        >
                            {/* Accent Line */}
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-primary/20 group-hover:bg-primary transition-colors" />

                            <div className="p-8 flex-1">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="w-14 h-14 rounded-2xl bg-foreground/5 flex items-center justify-center text-primary border border-border group-hover:scale-110 transition-transform">
                                        <Package className="w-7 h-7" />
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm text-muted-foreground font-black tracking-widest uppercase mb-1">Price</div>
                                        <div className="text-4xl font-black text-foreground">${t.price}</div>
                                    </div>
                                </div>

                                <h3 className="text-2xl font-black text-foreground mb-3 tracking-tight group-hover:text-primary transition-colors">
                                    {t.name}
                                </h3>
                                <p className="text-muted-foreground text-sm font-medium leading-relaxed mb-8">
                                    {t.description}
                                </p>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-sm font-bold text-foreground/80">
                                        <div className="w-5 h-5 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
                                            <Check className="w-3 h-3" />
                                        </div>
                                        Fast turnaround time
                                    </div>
                                    <div className="flex items-center gap-3 text-sm font-bold text-foreground/80">
                                        <div className="w-5 h-5 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
                                            <Check className="w-3 h-3" />
                                        </div>
                                        Unlimited Revisions
                                    </div>
                                    <div className="flex items-center gap-3 text-sm font-bold text-foreground/80">
                                        <div className="w-5 h-5 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
                                            <Check className="w-3 h-3" />
                                        </div>
                                        Original Source Files
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 pt-0">
                                <Link href="/dashboard">
                                    <button className="w-full py-4 rounded-[1.25rem] bg-foreground text-background font-black text-sm flex items-center justify-center gap-2 hover:bg-primary hover:text-white transition-all shadow-xl group/btn active:scale-95">
                                        Get Started
                                        <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                                    </button>
                                </Link>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Bottom Contact Section */}
            <div className="rounded-[2rem] bg-primary/10 border border-primary/20 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                        <ShoppingBag className="w-6 h-6" />
                    </div>
                    <div>
                        <h4 className="font-black text-foreground">Need a custom quote?</h4>
                        <p className="text-xs font-medium text-muted-foreground">For large scale projects or monthly retainers, contact our admin team.</p>
                    </div>
                </div>
                <button className="px-6 py-3 rounded-xl bg-primary text-white font-black text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20 active:scale-95">
                    Contact Sales
                </button>
            </div>
        </div>
    );
}
