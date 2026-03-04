"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { CheckCircle2, DollarSign, Activity, AlertCircle, Eye, Clock, Calendar, ExternalLink, Filter, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import DesignDetailDrawer from "@/components/dashboard/DesignDetailDrawer";
import { getTimeAgo, formatVietnamDate } from "@/lib/date-utils";

export default function DesignerOverview({ user }: { user: any }) {
  const [stats, setStats] = useState<any>(null);
  const [designs, setDesigns] = useState<any[]>([]);
  const [selectedHistoryMonth, setSelectedHistoryMonth] = useState<string>("all");
  const [selectedDesignId, setSelectedDesignId] = useState<string | null>(null);
  const [viewedDesignIds, setViewedDesignIds] = useState<Set<string>>(new Set());

  // Load viewedDesignIds from localStorage when user is available
  useEffect(() => {
    if (typeof window !== 'undefined' && user?.id) {
      const saved = localStorage.getItem(`viewedDesignIds_${user.id}`);
      if (saved) {
        setViewedDesignIds(new Set(JSON.parse(saved)));
      }
    }
  }, [user?.id]);

  // Save viewedDesignIds to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && user?.id) {
      localStorage.setItem(`viewedDesignIds_${user.id}`, JSON.stringify(Array.from(viewedDesignIds)));
    }
  }, [viewedDesignIds, user?.id]);

  const fetchDesigns = async () => {
    try {
      const res = await api.get("/designs");
      setDesigns(res.data);
    } catch (e) {
      console.error("Failed to load designs", e);
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (user?.id) {
          const res = await api.get(`/analytics/designer/${user.id}`);
          setStats(res.data);
        }
      } catch (e) {
        console.error("Failed to load designer stats", e);
      }
    };

    fetchStats();
    fetchDesigns();

    // Auto-refresh designs every 10 seconds to update comment counts
    const interval = setInterval(() => {
      fetchDesigns();
    }, 10000);

    return () => clearInterval(interval);
  }, [user]);

  // Get active designs (not completed)
  const activeDesigns = designs.filter(t => t.status !== 'completed');

  // Get completed designs
  const completedDesigns = designs.filter(t => t.status === 'completed');

  // Filter completed designs by month
  const getFilteredCompletedDesigns = () => {
    if (selectedHistoryMonth === "all") return completedDesigns;

    const now = new Date();
    const monthsAgo = parseInt(selectedHistoryMonth);
    const filterDate = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);

    return completedDesigns.filter(design => {
      const completedDate = new Date(design.updated_at || design.created_at);
      return completedDate >= filterDate;
    });
  };

  // Format time ago
  const formatDate = (dateString: string) => {
    return formatVietnamDate(dateString);
  };

  if (!stats) return <div className="animate-pulse">Loading overview...</div>;

  const filteredCompletedDesigns = getFilteredCompletedDesigns();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Personal Overview</h2>
        <p className="text-muted-foreground mt-1 text-sm">Welcome back! Here are your performance stats for this month.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {[
          { title: "Designs This Month", value: stats.total_designs_this_month || 0, icon: Activity, color: "text-blue-400" },
          { title: "Completed This Month", value: stats.completed_this_month || 0, icon: CheckCircle2, color: "text-green-400" },
        ].map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="p-6 rounded-2xl glass-panel relative overflow-hidden group shadow-xl shadow-black/20"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <card.icon className="w-24 h-24" />
            </div>
            <div className="relative z-10 flex flex-col justify-between h-full">
              <h3 className="text-sm font-medium text-muted-foreground">{card.title}</h3>
              <div className={`text-4xl font-bold mt-4 tracking-tighter ${card.color}`}>
                {card.value}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* My Active Designs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-2xl glass-panel p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold">My Active Designs</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {activeDesigns.length} {activeDesigns.length === 1 ? 'design' : 'designs'} in progress
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-sm">
                <th className="pb-4 font-semibold px-4">Title</th>
                <th className="pb-4 font-semibold px-4">Status</th>
                <th className="pb-4 font-semibold px-4">Price</th>
                <th className="pb-4 font-semibold px-4">Updated</th>
                <th className="pb-4 font-semibold px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {activeDesigns.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle2 className="w-12 h-12 text-muted-foreground/50" />
                      <p>No active designs</p>
                      <p className="text-xs">All caught up! Great work! 🎉</p>
                    </div>
                  </td>
                </tr>
              )}
              {activeDesigns.map((design, index) => (
                <motion.tr
                  key={design.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  onClick={() => {
                    setSelectedDesignId(design.id);
                    setViewedDesignIds(prev => new Set(prev).add(design.id));
                  }}
                  className="border-b border-border hover:bg-foreground/5 transition-colors group cursor-pointer"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      {design.image_url && (
                        <img
                          src={design.image_url}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="w-12 h-12 rounded-lg object-cover border border-border shrink-0 bg-foreground/5"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold text-foreground">{design.title}</div>
                          {design.comment_count > 0 && !viewedDesignIds.has(design.id) && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-pink-500/20 border border-pink-500/30"
                            >
                              <MessageSquare className="w-3 h-3 text-pink-400" />
                              <span className="text-xs font-bold text-pink-400">{design.comment_count}</span>
                            </motion.div>
                          )}
                        </div>
                        {design.description && (
                          <div className="text-xs text-muted-foreground mt-1 truncate max-w-[300px]">
                            {design.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className="px-3 py-1.5 rounded-full text-xs font-medium border"
                      style={{
                        backgroundColor:
                          design.status === 'review' ? 'rgba(250, 204, 21, 0.1)' :
                            design.status === 'in_progress' ? 'rgba(96, 165, 250, 0.1)' :
                              design.status === 'assigned' ? 'rgba(147, 51, 234, 0.1)' :
                                'rgba(128,128,128,0.1)',
                        color:
                          design.status === 'review' ? '#facc15' :
                            design.status === 'in_progress' ? '#60a5fa' :
                              design.status === 'assigned' ? '#9333ea' :
                                '#a1a1aa',
                        borderColor:
                          design.status === 'review' ? 'rgba(250, 204, 21, 0.3)' :
                            design.status === 'in_progress' ? 'rgba(96, 165, 250, 0.3)' :
                              design.status === 'assigned' ? 'rgba(147, 51, 234, 0.3)' :
                                'rgba(128,128,128,0.3)'
                      }}
                    >
                      {design.status.replace("_", " ").toUpperCase()}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="font-semibold text-primary text-lg">
                      ${design.price}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{getTimeAgo(design.updated_at || design.created_at)}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <button
                      className="px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 transition-all flex items-center gap-2 ml-auto opacity-0 group-hover:opacity-100"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Completed Designs History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-2xl glass-panel p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary" />
            <h3 className="text-xl font-semibold">My Completed Designs</h3>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={selectedHistoryMonth}
              onChange={(e) => setSelectedHistoryMonth(e.target.value)}
              className="px-3 py-2 rounded-lg bg-foreground/5 border border-border text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
            >
              <option value="all">All Time</option>
              <option value="0">This Month</option>
              <option value="1">Last Month</option>
              <option value="2">Last 2 Months</option>
              <option value="3">Last 3 Months</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-sm">
                <th className="pb-4 font-semibold px-4">Title</th>
                <th className="pb-4 font-semibold px-4">Price</th>
                <th className="pb-4 font-semibold px-4">Payment Status</th>
                <th className="pb-4 font-semibold px-4">Completed</th>
                <th className="pb-4 font-semibold px-4 text-right">Result</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompletedDesigns.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Activity className="w-12 h-12 text-muted-foreground/50" />
                      <p>No completed designs in this period</p>
                    </div>
                  </td>
                </tr>
              )}
              {filteredCompletedDesigns.slice(0, 10).map((design, index) => (
                <motion.tr
                  key={design.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  onClick={() => {
                    setSelectedDesignId(design.id);
                    setViewedDesignIds(prev => new Set(prev).add(design.id));
                  }}
                  className="border-b border-border hover:bg-foreground/5 transition-colors group cursor-pointer"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      {design.image_url && (
                        <img
                          src={design.image_url}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="w-10 h-10 rounded-lg object-cover border border-border shrink-0 bg-foreground/5"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold text-foreground">{design.title}</div>
                          {design.comment_count > 0 && !viewedDesignIds.has(design.id) && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-pink-500/20 border border-pink-500/30"
                            >
                              <MessageSquare className="w-3 h-3 text-pink-400" />
                              <span className="text-xs font-bold text-pink-400">{design.comment_count}</span>
                            </motion.div>
                          )}
                        </div>
                        {design.description && (
                          <div className="text-xs text-muted-foreground mt-1 truncate max-w-[200px]">
                            {design.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="font-semibold text-primary text-lg">
                      ${design.price}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className="px-3 py-1.5 rounded-full text-xs font-medium border"
                      style={{
                        backgroundColor: design.payment_status === 'paid'
                          ? 'rgba(74, 222, 128, 0.1)'
                          : 'rgba(239, 68, 68, 0.1)',
                        color: design.payment_status === 'paid'
                          ? '#4ade80'
                          : '#ef4444',
                        borderColor: design.payment_status === 'paid'
                          ? 'rgba(74, 222, 128, 0.3)'
                          : 'rgba(239, 68, 68, 0.3)'
                      }}
                    >
                      {design.payment_status === 'paid' ? '✓ PAID' : '✗ UNPAID'}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-sm text-muted-foreground">
                      {getTimeAgo(design.updated_at || design.created_at)}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    {design.result_link ? (
                      <a
                        href={design.result_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 transition-all flex items-center gap-2 ml-auto opacity-0 group-hover:opacity-100"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View Result
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">No result link</span>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCompletedDesigns.length > 10 && (
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Showing 10 of {filteredCompletedDesigns.length} completed designs
          </div>
        )}
      </motion.div>

      {/* Design Detail Drawer */}
      <DesignDetailDrawer
        designId={selectedDesignId}
        onClose={() => {
          setSelectedDesignId(null);
          // Refresh designs to update comment counts
          fetchDesigns();
        }}
        currentUser={user}
        onUpdate={fetchDesigns}
      />
    </div>
  );
}
