"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import { formatVietnamDate, getTimeAgo } from "@/lib/date-utils";
import {
  Wallet,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Calendar,
  Eye,
  ExternalLink,
  Filter,
  Download
} from "lucide-react";

export default function EarningsPage() {
  const [user, setUser] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchTickets();
      fetchStats();
    }
  }, [user]);

  const fetchTickets = async () => {
    try {
      const res = await api.get("/tickets/");
      setTickets(res.data);
    } catch (e) {
      console.error("Failed to load tickets", e);
    }
  };

  const fetchStats = async () => {
    try {
      if (user?.id) {
        const res = await api.get(`/analytics/designer/${user.id}`);
        setStats(res.data);
      }
    } catch (e) {
      console.error("Failed to load stats", e);
    }
  };

  // Get completed tickets only
  const completedTickets = tickets.filter(t => t.status === 'completed');

  // Calculate earnings breakdown
  const getEarningsBreakdown = () => {
    const totalEarned = completedTickets.reduce((sum, t) => sum + (parseFloat(t.price) || 0), 0);
    const totalPaid = completedTickets.filter(t => t.payment_status === 'paid').reduce((sum, t) => sum + (parseFloat(t.price) || 0), 0);
    const totalUnpaid = completedTickets.filter(t => t.payment_status === 'unpaid').reduce((sum, t) => sum + (parseFloat(t.price) || 0), 0);

    return { totalEarned, totalPaid, totalUnpaid };
  };

  // Filter unpaid tickets by month
  const getFilteredUnpaidTickets = () => {
    const unpaidTickets = completedTickets.filter(t => t.payment_status === 'unpaid');

    if (selectedMonth === "all") return unpaidTickets;

    const now = new Date();
    const monthsAgo = parseInt(selectedMonth);
    const filterDate = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);

    return unpaidTickets.filter(ticket => {
      const completedDate = new Date(ticket.updated_at || ticket.created_at);
      return completedDate >= filterDate;
    });
  };

  // Get monthly earnings history (last 6 months)
  const getMonthlyEarningsHistory = () => {
    const months: { [key: string]: { earned: number; paid: number; unpaid: number } } = {};
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      months[monthKey] = { earned: 0, paid: 0, unpaid: 0 };
    }

    completedTickets.forEach(ticket => {
      const completedDate = new Date(ticket.updated_at || ticket.created_at);
      const monthKey = completedDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

      if (months[monthKey]) {
        const price = parseFloat(ticket.price) || 0;
        months[monthKey].earned += price;
        if (ticket.payment_status === 'paid') {
          months[monthKey].paid += price;
        } else {
          months[monthKey].unpaid += price;
        }
      }
    });

    return months;
  };

  const formatDate = (dateString: string) => {
    return formatVietnamDate(dateString);
  };

  const earningsBreakdown = getEarningsBreakdown();
  const filteredUnpaidTickets = getFilteredUnpaidTickets();
  const monthlyHistory = getMonthlyEarningsHistory();
  const maxMonthlyEarning = Math.max(...Object.values(monthlyHistory).map(m => m.earned), 1);

  if (!user || user.role !== 'designer') {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Access denied. Designer role required.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">My Earnings</h2>
        <p className="text-muted-foreground mt-1 text-sm">Track your income, payments, and pending balances.</p>
      </div>

      {/* Main Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Total Lifetime Earnings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="p-6 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border-2 border-primary/30 shadow-lg shadow-primary/10 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Wallet className="w-32 h-32" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-medium text-muted-foreground">Total Lifetime Earnings</h3>
            </div>
            <div className="text-4xl font-bold text-primary mb-2">
              ${earningsBreakdown.totalEarned.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              From {completedTickets.length} completed ticket{completedTickets.length !== 1 ? 's' : ''}
            </p>
          </div>
        </motion.div>

        {/* Total Paid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="p-6 rounded-2xl glass-panel border-2 border-green-500/30 shadow-lg shadow-green-500/10 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <CheckCircle2 className="w-32 h-32 text-green-400" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <h3 className="text-sm font-medium text-muted-foreground">Total Paid</h3>
            </div>
            <div className="text-4xl font-bold text-green-400 mb-2">
              ${earningsBreakdown.totalPaid.toFixed(2)}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-foreground/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-500"
                  style={{ width: `${earningsBreakdown.totalEarned > 0 ? (earningsBreakdown.totalPaid / earningsBreakdown.totalEarned) * 100 : 0}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">
                {earningsBreakdown.totalEarned > 0 ? Math.round((earningsBreakdown.totalPaid / earningsBreakdown.totalEarned) * 100) : 0}%
              </span>
            </div>
          </div>
        </motion.div>

        {/* Total Unpaid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="p-6 rounded-2xl glass-panel border-2 border-red-500/30 shadow-lg shadow-red-500/10 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <AlertCircle className="w-32 h-32 text-red-400" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <h3 className="text-sm font-medium text-muted-foreground">Total Unpaid</h3>
            </div>
            <div className="text-4xl font-bold text-red-400 mb-2">
              ${earningsBreakdown.totalUnpaid.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {completedTickets.filter(t => t.payment_status === 'unpaid').length} ticket{completedTickets.filter(t => t.payment_status === 'unpaid').length !== 1 ? 's' : ''} pending payment
            </p>
          </div>
        </motion.div>
      </div>

      {/* Monthly Earnings Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="rounded-2xl glass-panel p-6"
      >
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-6 h-6 text-primary" />
          <h3 className="text-xl font-semibold">Monthly Earnings Trend</h3>
        </div>

        <div className="space-y-4">
          {Object.entries(monthlyHistory).map(([month, data], index) => (
            <motion.div
              key={month}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.05, duration: 0.4 }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">{month}</span>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-green-400 font-semibold">
                    Paid: ${data.paid.toFixed(0)}
                  </span>
                  <span className="text-red-400 font-semibold">
                    Unpaid: ${data.unpaid.toFixed(0)}
                  </span>
                  <span className="text-primary font-bold">
                    Total: ${data.earned.toFixed(0)}
                  </span>
                </div>
              </div>
              <div className="w-full h-4 bg-foreground/5 rounded-full overflow-hidden flex">
                {data.earned > 0 && (
                  <>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(data.paid / maxMonthlyEarning) * 100}%` }}
                      transition={{ delay: 0.5 + index * 0.05, duration: 0.6, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-green-500 to-green-400"
                    />
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(data.unpaid / maxMonthlyEarning) * 100}%` }}
                      transition={{ delay: 0.5 + index * 0.05, duration: 0.6, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-red-500 to-red-400"
                    />
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Unpaid Tickets List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="rounded-2xl glass-panel p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <h3 className="text-xl font-semibold">Unpaid Tickets</h3>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Total Outstanding: <span className="text-red-400 font-bold text-lg">${filteredUnpaidTickets.reduce((sum, t) => sum + (parseFloat(t.price) || 0), 0).toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-4 py-2 bg-foreground/5 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all"
              >
                <option value="all">All Time</option>
                <option value="0">This Month</option>
                <option value="1">Last Month</option>
                <option value="2">Last 2 Months</option>
                <option value="3">Last 3 Months</option>
                <option value="6">Last 6 Months</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-sm">
                <th className="pb-4 font-semibold px-4">Ticket</th>
                <th className="pb-4 font-semibold px-4">Completed Date</th>
                <th className="pb-4 font-semibold px-4">Days Waiting</th>
                <th className="pb-4 font-semibold px-4">Amount</th>
                <th className="pb-4 font-semibold px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUnpaidTickets.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle2 className="w-12 h-12 text-green-400/50" />
                      <p className="font-semibold">All caught up!</p>
                      <p className="text-xs">No unpaid tickets in this period 🎉</p>
                    </div>
                  </td>
                </tr>
              )}
              {filteredUnpaidTickets.map((ticket, index) => {
                const completedDate = new Date(ticket.updated_at || ticket.created_at);
                const daysWaiting = Math.floor((new Date().getTime() - completedDate.getTime()) / (1000 * 60 * 60 * 24));

                return (
                  <motion.tr
                    key={ticket.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.05, duration: 0.4 }}
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
                      <div className="text-sm text-muted-foreground">
                        {completedDate.toLocaleDateString()}
                      </div>
                      <div className="text-xs text-muted-foreground/70">
                        {getTimeAgo(ticket.updated_at || ticket.created_at)}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${daysWaiting > 30
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : daysWaiting > 14
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}>
                        <Calendar className="w-3 h-3" />
                        {daysWaiting} day{daysWaiting !== 1 ? 's' : ''}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-lg font-bold text-red-400">
                        ${ticket.price}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {ticket.result_link && (
                          <a
                            href={ticket.result_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-all flex items-center gap-1.5"
                          >
                            <ExternalLink className="w-3 h-3" />
                            View Result
                          </a>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredUnpaidTickets.length > 0 && (
          <div className="mt-6 pt-6 border-t border-border">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {filteredUnpaidTickets.length} unpaid ticket{filteredUnpaidTickets.length !== 1 ? 's' : ''}
              </p>
              <div className="text-right">
                <p className="text-xs text-muted-foreground mb-1">Total Amount Due</p>
                <p className="text-2xl font-bold text-red-400">
                  ${filteredUnpaidTickets.reduce((sum, t) => sum + (parseFloat(t.price) || 0), 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
