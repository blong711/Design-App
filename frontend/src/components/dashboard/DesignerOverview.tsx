"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { CheckCircle2, DollarSign, Activity, AlertCircle, Eye, Clock, TrendingUp, Calendar, Wallet, ExternalLink, Filter } from "lucide-react";
import { motion } from "framer-motion";
import { formatVietnamDate, getTimeAgo } from "@/lib/date-utils";

export default function DesignerOverview({ user }: { user: any }) {
  const [stats, setStats] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedHistoryMonth, setSelectedHistoryMonth] = useState<string>("all");

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

    const fetchTickets = async () => {
      try {
        const res = await api.get("/tickets/");
        setTickets(res.data);
      } catch (e) {
        console.error("Failed to load tickets", e);
      }
    };

    fetchStats();
    fetchTickets();
  }, [user]);

  // Get active tickets (not completed)
  const activeTickets = tickets.filter(t => t.status !== 'completed');

  // Get completed tickets
  const completedTickets = tickets.filter(t => t.status === 'completed');

  // Calculate earnings breakdown
  const getEarningsBreakdown = () => {
    const totalEarned = completedTickets.reduce((sum, t) => sum + (parseFloat(t.price) || 0), 0);
    const totalPaid = completedTickets.filter(t => t.payment_status === 'paid').reduce((sum, t) => sum + (parseFloat(t.price) || 0), 0);
    const totalUnpaid = completedTickets.filter(t => t.payment_status === 'unpaid').reduce((sum, t) => sum + (parseFloat(t.price) || 0), 0);

    return { totalEarned, totalPaid, totalUnpaid };
  };

  // Get completed tickets by week for chart
  const getWeeklyCompletedData = () => {
    const weeks: { [key: string]: number } = {};
    const now = new Date();

    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7) - now.getDay());
      const weekKey = `Week ${4 - i}`;
      weeks[weekKey] = 0;
    }

    completedTickets.forEach(ticket => {
      const completedDate = new Date(ticket.updated_at || ticket.created_at);
      const weeksAgo = Math.floor((now.getTime() - completedDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
      if (weeksAgo >= 0 && weeksAgo < 4) {
        const weekKey = `Week ${4 - weeksAgo}`;
        if (weeks[weekKey] !== undefined) {
          weeks[weekKey]++;
        }
      }
    });

    return weeks;
  };

  // Filter completed tickets by month
  const getFilteredCompletedTickets = () => {
    if (selectedHistoryMonth === "all") return completedTickets;

    const now = new Date();
    const monthsAgo = parseInt(selectedHistoryMonth);
    const filterDate = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);

    return completedTickets.filter(ticket => {
      const completedDate = new Date(ticket.updated_at || ticket.created_at);
      return completedDate >= filterDate;
    });
  };

  // Format time ago
  const formatDate = (dateString: string) => {
    return formatVietnamDate(dateString);
  };

  if (!stats) return <div className="animate-pulse">Loading overview...</div>;


  const earningsBreakdown = getEarningsBreakdown();
  const weeklyData = getWeeklyCompletedData();
  const maxWeeklyCount = Math.max(...Object.values(weeklyData), 1);
  const filteredCompletedTickets = getFilteredCompletedTickets();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Personal Overview</h2>
        <p className="text-muted-foreground mt-1 text-sm">Welcome back! Here are your performance stats for this month.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Designs This Month", value: stats.total_designs_this_month || 0, icon: Activity, color: "text-blue-400" },
          { title: "Completed This Month", value: stats.completed_this_month || 0, icon: CheckCircle2, color: "text-green-400" },
          { title: "Total Unpaid (Debt)", value: `$${stats.total_unpaid || 0}`, icon: AlertCircle, color: "text-red-400" },
          { title: "Earnings This Month", value: `$${stats.earnings_this_month || 0}`, icon: DollarSign, color: "text-primary" },
        ].map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
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

      {/* My Active Tickets */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="rounded-2xl glass-panel p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold">My Active Tickets</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {activeTickets.length} {activeTickets.length === 1 ? 'ticket' : 'tickets'} in progress
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
              {activeTickets.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle2 className="w-12 h-12 text-muted-foreground/50" />
                      <p>No active tickets</p>
                      <p className="text-xs">All caught up! Great work! 🎉</p>
                    </div>
                  </td>
                </tr>
              )}
              {activeTickets.map((ticket, index) => (
                <motion.tr
                  key={ticket.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1, duration: 0.4 }}
                  className="border-b border-border hover:bg-foreground/5 transition-colors group"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      {ticket.image_url && (
                        <img
                          src={ticket.image_url}
                          alt=""
                          className="w-12 h-12 rounded-lg object-cover border border-border shrink-0"
                        />
                      )}
                      <div className="flex-1">
                        <div className="font-semibold text-foreground">{ticket.title}</div>
                        {ticket.description && (
                          <div className="text-xs text-muted-foreground mt-1 truncate max-w-[300px]">
                            {ticket.description}
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
                          ticket.status === 'review' ? 'rgba(250, 204, 21, 0.1)' :
                            ticket.status === 'in_progress' ? 'rgba(96, 165, 250, 0.1)' :
                              ticket.status === 'assigned' ? 'rgba(147, 51, 234, 0.1)' :
                                'rgba(128,128,128,0.1)',
                        color:
                          ticket.status === 'review' ? '#facc15' :
                            ticket.status === 'in_progress' ? '#60a5fa' :
                              ticket.status === 'assigned' ? '#9333ea' :
                                '#a1a1aa',
                        borderColor:
                          ticket.status === 'review' ? 'rgba(250, 204, 21, 0.3)' :
                            ticket.status === 'in_progress' ? 'rgba(96, 165, 250, 0.3)' :
                              ticket.status === 'assigned' ? 'rgba(147, 51, 234, 0.3)' :
                                'rgba(128,128,128,0.3)'
                      }}
                    >
                      {ticket.status.replace("_", " ").toUpperCase()}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="font-semibold text-primary text-lg">
                      ${ticket.price}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{getTimeAgo(ticket.updated_at || ticket.created_at)}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <button className="px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 transition-all flex items-center gap-2 ml-auto opacity-0 group-hover:opacity-100">
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

      {/* Earnings Breakdown & Progress Chart */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Earnings Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="rounded-2xl glass-panel p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <Wallet className="w-6 h-6 text-primary" />
            <h3 className="text-xl font-semibold">Earnings Breakdown</h3>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30">
              <div className="text-sm text-muted-foreground mb-1">Total Lifetime Earnings</div>
              <div className="text-3xl font-bold text-primary">${earningsBreakdown.totalEarned.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground mt-2">{completedTickets.length} completed tickets</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <div className="text-sm text-muted-foreground">Total Paid</div>
                </div>
                <div className="text-2xl font-bold text-green-400">${earningsBreakdown.totalPaid.toFixed(2)}</div>
              </div>

              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <div className="text-sm text-muted-foreground">Total Unpaid</div>
                </div>
                <div className="text-2xl font-bold text-red-400">${earningsBreakdown.totalUnpaid.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Progress Chart - Completed per Week */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="rounded-2xl glass-panel p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-6 h-6 text-primary" />
            <h3 className="text-xl font-semibold">Weekly Progress</h3>
          </div>

          <div className="space-y-4">
            {Object.entries(weeklyData).map(([week, count], index) => (
              <motion.div
                key={week}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.1, duration: 0.4 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">{week}</span>
                  <span className="text-sm font-bold text-primary">{count} tickets</span>
                </div>
                <div className="w-full h-3 bg-foreground/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(count / maxWeeklyCount) * 100}%` }}
                    transition={{ delay: 0.8 + index * 0.1, duration: 0.6, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                  />
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/20">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Total (Last 4 Weeks)</div>
              <div className="text-2xl font-bold text-primary">
                {Object.values(weeklyData).reduce((a, b) => a + b, 0)}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Completed Tickets History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="rounded-2xl glass-panel p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary" />
            <h3 className="text-xl font-semibold">My Completed Tickets</h3>
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
              {filteredCompletedTickets.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Activity className="w-12 h-12 text-muted-foreground/50" />
                      <p>No completed tickets in this period</p>
                    </div>
                  </td>
                </tr>
              )}
              {filteredCompletedTickets.slice(0, 10).map((ticket, index) => (
                <motion.tr
                  key={ticket.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + index * 0.05, duration: 0.4 }}
                  className="border-b border-border hover:bg-foreground/5 transition-colors group"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      {ticket.image_url && (
                        <img
                          src={ticket.image_url}
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover border border-border shrink-0"
                        />
                      )}
                      <div className="flex-1">
                        <div className="font-semibold text-foreground">{ticket.title}</div>
                        {ticket.description && (
                          <div className="text-xs text-muted-foreground mt-1 truncate max-w-[200px]">
                            {ticket.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="font-semibold text-primary text-lg">
                      ${ticket.price}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className="px-3 py-1.5 rounded-full text-xs font-medium border"
                      style={{
                        backgroundColor: ticket.payment_status === 'paid'
                          ? 'rgba(74, 222, 128, 0.1)'
                          : 'rgba(239, 68, 68, 0.1)',
                        color: ticket.payment_status === 'paid'
                          ? '#4ade80'
                          : '#ef4444',
                        borderColor: ticket.payment_status === 'paid'
                          ? 'rgba(74, 222, 128, 0.3)'
                          : 'rgba(239, 68, 68, 0.3)'
                      }}
                    >
                      {ticket.payment_status === 'paid' ? '✓ PAID' : '✗ UNPAID'}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-sm text-muted-foreground">
                      {getTimeAgo(ticket.updated_at || ticket.created_at)}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    {ticket.result_link ? (
                      <a
                        href={ticket.result_link}
                        target="_blank"
                        rel="noopener noreferrer"
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

        {filteredCompletedTickets.length > 10 && (
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Showing 10 of {filteredCompletedTickets.length} completed tickets
          </div>
        )}
      </motion.div>
    </div>
  );
}
