"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { X, Star, ExternalLink, Calendar, MessageCircle, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DesignerPortfolioModal({ designer, onClose }: { designer: any; onClose: () => void }) {
    const [bestWorks, setBestWorks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBestWorks();
    }, [designer.id]);

    const fetchBestWorks = async () => {
        try {
            const res = await api.get(`/designs?assigned_to=${designer.id}&status=completed`);
            // Sort by rating desc, then date desc
            const works = res.data.sort((a: any, b: any) => {
                const rA = a.rating || 0;
                const rB = b.rating || 0;
                if (rB !== rA) return rB - rA;
                return new Date(b.completed_at || b.updated_at).getTime() - new Date(a.completed_at || a.updated_at).getTime();
            });
            setBestWorks(works.slice(0, 6)); // Top 6 works
        } catch (e) {
            console.error("Failed to fetch portfolio", e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/80 backdrop-blur-md"
                    onClick={onClose}
                />

                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-5xl bg-background border border-border rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="p-8 border-b border-border bg-gradient-to-r from-primary/5 to-accent/5 flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-white text-2xl font-black shadow-2xl shadow-primary/20">
                                {designer.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h2 className="text-3xl font-black text-foreground tracking-tight">{designer.name}'s Portfolio</h2>
                                <p className="text-muted-foreground font-medium flex items-center gap-2 mt-1">
                                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                    Top Rated Showcase • {bestWorks.length} Highlights
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-3 rounded-2xl hover:bg-foreground/5 transition-colors border border-border">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Gallery */}
                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[1, 2, 3].map(i => <div key={i} className="aspect-square rounded-3xl bg-foreground/5 animate-pulse" />)}
                            </div>
                        ) : bestWorks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <AlertCircle className="w-12 h-12 text-muted-foreground/30 mb-4" />
                                <h3 className="text-xl font-bold text-muted-foreground">No completed works yet.</h3>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {bestWorks.map((work, idx) => (
                                    <motion.div
                                        key={work.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="group relative flex flex-col rounded-[2rem] border border-border overflow-hidden bg-foreground/5 hover:border-primary/50 transition-all shadow-xl"
                                    >
                                        <div className="aspect-[4/3] overflow-hidden relative">
                                            {work.image_url ? (
                                                <img src={work.image_url} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                            ) : (
                                                <div className="w-full h-full bg-foreground/10 flex items-center justify-center">
                                                    <Star className="w-10 h-10 text-muted-foreground/20" />
                                                </div>
                                            )}

                                            <div className="absolute top-4 right-4 flex gap-2">
                                                {work.rating && (
                                                    <div className="px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 text-amber-400 font-black text-xs flex items-center gap-1.5 shadow-2xl">
                                                        <Star className="w-3 h-3 fill-amber-400" />
                                                        {work.rating}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="p-6">
                                            <h4 className="font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">{work.title}</h4>
                                            {work.review && (
                                                <p className="text-xs text-muted-foreground mt-2 italic line-clamp-2 leading-relaxed font-medium">
                                                    "{work.review}"
                                                </p>
                                            )}
                                            <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                                                <span className="flex items-center gap-1.5 line-clamp-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(work.completed_at || work.updated_at).toLocaleDateString()}
                                                </span>
                                                <span className="text-primary">${work.price}</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
