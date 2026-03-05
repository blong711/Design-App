"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, X, Info, AlertTriangle } from "lucide-react";

export default function BroadcastBanner() {
    const [broadcast, setBroadcast] = useState<any>(null);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        const fetchBroadcast = async () => {
            try {
                const res = await api.get("/notifications");
                if (res.data && res.data.message) {
                    setBroadcast(res.data);
                    // Check if this particular broadcast was already dismissed
                    const saved = localStorage.getItem(`dismissed_broadcast_${res.data.id}`);
                    if (saved) setDismissed(true);
                }
            } catch (e) {
                console.error("Failed to fetch broadcast", e);
            }
        };

        fetchBroadcast();
        // Refresh every 5 minutes
        const interval = setInterval(fetchBroadcast, 300000);
        return () => clearInterval(interval);
    }, []);

    const handleDismiss = () => {
        if (broadcast) {
            localStorage.setItem(`dismissed_broadcast_${broadcast.id}`, "true");
            setDismissed(true);
        }
    };

    if (!broadcast || dismissed) return null;

    const bannerStyles = {
        danger: {
            bg: 'bg-red-500/10 border-red-500/20 text-red-500',
            glow: 'bg-red-500',
            icon: AlertCircle
        },
        warning: {
            bg: 'bg-amber-500/10 border-amber-500/20 text-amber-500',
            glow: 'bg-amber-500',
            icon: AlertTriangle
        },
        info: {
            bg: 'bg-primary/10 border-primary/20 text-primary',
            glow: 'bg-primary',
            icon: Info
        }
    };

    const style = bannerStyles[broadcast.type as keyof typeof bannerStyles] || bannerStyles.info;
    const Icon = style.icon;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                className="relative px-6 py-4 z-50"
            >
                <div className={`max-w-7xl mx-auto rounded-[1.25rem] border backdrop-blur-md shadow-2xl shadow-black/5 overflow-hidden ${style.bg} transition-all duration-500`}>
                    {/* Decorative Background Pattern */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_0%_0%,#fff_0%,transparent_50%)]" />
                    </div>

                    <div className="relative px-5 py-3.5 flex items-center justify-between gap-6">
                        <div className="flex items-center gap-4 flex-1">
                            {/* Icon Container with Glow */}
                            <div className="relative shrink-0">
                                <div className={`absolute inset-0 blur-lg opacity-40 ${style.glow}`} />
                                <div className={`relative w-9 h-9 rounded-xl flex items-center justify-center bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                            </div>

                            {/* Text Content */}
                            <div className="flex flex-col min-w-0">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-0.5">
                                    System Broadcast
                                </span>
                                <p className="text-sm font-bold tracking-tight leading-relaxed line-clamp-2 brightness-90">
                                    {broadcast.message}
                                </p>
                            </div>
                        </div>

                        {/* Close Action */}
                        <button
                            onClick={handleDismiss}
                            className="p-2.5 rounded-xl hover:bg-white/10 border border-transparent hover:border-white/10 transition-all active:scale-95 shrink-0 group"
                            title="Dismiss Notification"
                        >
                            <X className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                        </button>
                    </div>

                    {/* Bottom Progress Accent */}
                    <div className={`absolute bottom-0 left-0 h-[2px] w-full ${style.glow} opacity-20`} />
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
