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

    const bgColor = broadcast.type === 'danger' ? 'bg-red-500' :
        broadcast.type === 'warning' ? 'bg-amber-500' : 'bg-primary';

    const Icon = broadcast.type === 'danger' ? AlertCircle :
        broadcast.type === 'warning' ? AlertTriangle : Info;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className={`${bgColor} text-white relative overflow-hidden`}
            >
                <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 shrink-0" />
                        <p className="text-sm font-bold tracking-wide">
                            {broadcast.message}
                        </p>
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
