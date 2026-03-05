"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Trophy, Star, TrendingUp, Medal, Crown, Activity } from "lucide-react";
import { motion } from "framer-motion";

export default function RankingsView() {
    const [rankings, setRankings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRankings = async () => {
            try {
                const res = await api.get("/analytics/rankings");
                setRankings(res.data);
            } catch (e) {
                console.error("Failed to fetch rankings", e);
            } finally {
                setLoading(false);
            }
        };

        fetchRankings();
    }, []);

    const getMedalColor = (index: number) => {
        switch (index) {
            case 0: return "text-amber-400"; // Gold
            case 1: return "text-slate-300"; // Silver
            case 2: return "text-amber-700"; // Bronze
            default: return "text-muted-foreground";
        }
    };

    const getRankIcon = (index: number) => {
        switch (index) {
            case 0: return <Crown className="w-6 h-6 text-amber-400" />;
            case 1: return <Medal className="w-6 h-6 text-slate-300" />;
            case 2: return <Medal className="w-6 h-6 text-amber-700" />;
            default: return <span className="text-lg font-black text-muted-foreground">{index + 1}</span>;
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-foreground/5 border border-border p-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                    <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_100%_0%,#fff_0%,transparent_50%)]" />
                </div>

                <div className="relative z-10 space-y-4 text-center md:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest shadow-xl">
                        <Trophy className="w-3.5 h-3.5" />
                        Official Leaderboard
                    </div>
                    <h1 className="text-4xl font-black text-foreground tracking-tight">Designer Rankings</h1>
                    <p className="text-muted-foreground font-medium max-w-sm">
                        Honoring our top creative talents based on production quality and consistency.
                    </p>
                </div>

                <div className="flex gap-4">
                    <div className="p-6 rounded-3xl glass-panel border border-border flex flex-col items-center">
                        <Activity className="w-6 h-6 text-blue-400 mb-2" />
                        <div className="text-2xl font-black">{rankings.length}</div>
                        <div className="text-[10px] font-bold uppercase text-muted-foreground">Designers</div>
                    </div>
                    <div className="p-6 rounded-3xl glass-panel border border-border flex flex-col items-center">
                        <Star className="w-6 h-6 text-amber-400 mb-2" />
                        <div className="text-2xl font-black">4.8+</div>
                        <div className="text-[10px] font-bold uppercase text-muted-foreground">Avg Team Score</div>
                    </div>
                </div>
            </div>

            {/* Top 3 Spotlight */}
            {!loading && rankings.length >= 3 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    {[1, 0, 2].map((idx) => {
                        const r = rankings[idx];
                        const isTop1 = idx === 0;
                        return (
                            <motion.div
                                key={r.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 + idx * 0.1 }}
                                className={`relative flex flex-col items-center p-8 rounded-[3rem] border transition-all duration-500 shadow-2xl ${isTop1
                                        ? 'bg-gradient-to-b from-amber-400/10 to-transparent border-amber-400/30 scale-105 z-10'
                                        : 'bg-foreground/5 border-border mt-8'
                                    }`}
                            >
                                <div className="absolute top-6">
                                    {getRankIcon(idx)}
                                </div>

                                <div className={`relative mt-10 mb-6 group`}>
                                    <div className={`absolute inset-0 blur-2xl opacity-20 transition-opacity group-hover:opacity-40 ${isTop1 ? 'bg-amber-400' : 'bg-primary'}`} />
                                    <div className={`relative w-24 h-24 rounded-[2rem] border-4 overflow-hidden shadow-2xl ${isTop1 ? 'border-amber-400' : 'border-white/10'}`}>
                                        {r.avatar_url ? (
                                            <img src={r.avatar_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-foreground/10 flex items-center justify-center text-3xl font-black text-foreground">
                                                {r.name.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <h3 className="text-xl font-black text-foreground mb-1">{r.name}</h3>
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-6">@{r.username}</p>

                                <div className="grid grid-cols-2 gap-4 w-full pt-6 border-t border-white/5">
                                    <div className="text-center">
                                        <div className="text-lg font-black text-foreground">{r.completed}</div>
                                        <div className="text-[10px] uppercase font-bold text-muted-foreground">Done</div>
                                    </div>
                                    <div className="text-center">
                                        <div className={`text-lg font-black flex items-center justify-center gap-1 ${r.avgRating !== 'N/A' ? 'text-amber-400' : 'text-muted-foreground'}`}>
                                            <Star className="w-3.5 h-3.5 fill-current" />
                                            {r.avgRating}
                                        </div>
                                        <div className="text-[10px] uppercase font-bold text-muted-foreground">Rating</div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Rankings Table */}
            <div className="rounded-[2.5rem] glass-panel border border-border p-8 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-widest font-black">
                                <th className="pb-6 px-6">Rank</th>
                                <th className="pb-6 px-6">Designer</th>
                                <th className="pb-6 px-6 text-center">Completed</th>
                                <th className="pb-6 px-6 text-center">Efficiency</th>
                                <th className="pb-6 px-6 text-right">Avg Rating</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="py-6 px-6">
                                            <div className="h-12 bg-white/5 rounded-2xl w-full" />
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                rankings.map((r, index) => (
                                    <motion.tr
                                        key={r.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 * index }}
                                        className="group border-b border-border/50 hover:bg-foreground/5 transition-all duration-300"
                                    >
                                        <td className="py-5 px-6">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${getMedalColor(index)}`}>
                                                    {index + 1}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-5 px-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-foreground/5 border border-border overflow-hidden shrink-0 shadow-lg">
                                                    {r.avatar_url ? (
                                                        <img src={r.avatar_url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-xs font-black text-muted-foreground">
                                                            {r.name.charAt(0)}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-foreground group-hover:text-primary transition-colors">{r.name}</p>
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">@{r.username}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-5 px-6 text-center">
                                            <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-xl bg-primary/10 text-primary text-sm font-black shadow-inner">
                                                {r.completed}
                                            </span>
                                        </td>
                                        <td className="py-5 px-6 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="text-sm font-bold flex items-center gap-1.5 text-blue-400">
                                                    <TrendingUp className="w-3.5 h-3.5" />
                                                    +{r.thisMonth}
                                                </div>
                                                <div className="text-[10px] uppercase font-black opacity-30">This Month</div>
                                            </div>
                                        </td>
                                        <td className="py-5 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <div className={`px-4 py-2 rounded-2xl bg-foreground/5 border border-border font-black text-sm flex items-center gap-2 ${r.avgRating !== 'N/A' ? 'text-amber-400' : 'text-muted-foreground'}`}>
                                                    <Star className={`w-3.5 h-3.5 ${r.avgRating !== 'N/A' ? 'fill-current' : ''}`} />
                                                    {r.avgRating}
                                                </div>
                                            </div>
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
