"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LogOut, Palette, LayoutDashboard, Briefcase, Settings, Activity, Users, UserCircle2, ShoppingCart, Wallet, MessageSquare, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { useSettings } from "@/lib/settings-context";
import { api } from "@/lib/api";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [customerBalance, setCustomerBalance] = useState<number | null>(null);
  const { layoutMode } = useSettings();

  const [pendingDepositCount, setPendingDepositCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const storedUser = localStorage.getItem("user");
    if (!token || !storedUser) {
      router.push("/login");
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    setLoading(false);
    if (parsedUser?.role === "customer") {
      api.get("/auth/me").then((res) => {
        if (res.data?.balance !== undefined) setCustomerBalance(res.data.balance);
      }).catch(() => { });
    }
  }, [router]);

  // Poll pending deposit count for admin
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return;
    const parsedUser = JSON.parse(storedUser);
    if (parsedUser?.role !== "admin") return;

    const fetchPendingDeposits = () => {
      api.get("/deposits?status=pending").then((res) => {
        setPendingDepositCount(Array.isArray(res.data) ? res.data.length : 0);
      }).catch(() => { });
    };
    fetchPendingDeposits();
    const interval = setInterval(fetchPendingDeposits, 30000);
    return () => clearInterval(interval);
  }, []);

  // Sync user info when account page updates localStorage
  useEffect(() => {
    const onStorage = () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) setUser(JSON.parse(storedUser));
    };
    window.addEventListener("storage", onStorage);
    // Also listen for same-tab updates via custom event
    window.addEventListener("user-updated", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("user-updated", onStorage);
    };
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  if (loading) return null;

  const adminLinks = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "All Designs", href: "/dashboard/designs", icon: Briefcase },
    { name: "Users", href: "/dashboard/users", icon: UserCircle2 },
    { name: "Transactions", href: "/dashboard/transactions", icon: Wallet, badge: pendingDepositCount },
    { name: "API Keys", href: "/dashboard/api-keys", icon: Settings },
  ];

  const customerLinks = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "My Designs", href: "/dashboard/designs", icon: Briefcase },
    { name: "Brand Kit", href: "/dashboard/brand", icon: Palette },
    { name: "Project Pricing", href: "/dashboard/pricing", icon: ShoppingCart },
    { name: "Transactions", href: "/dashboard/transactions", icon: Wallet },
    { name: "Support Hub", href: "/dashboard/support", icon: MessageSquare },
  ];

  const designerLinks = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Design Board", href: "/dashboard/board", icon: Activity },
    { name: "Rankings", href: "/dashboard/rankings", icon: Trophy },
  ];

  const links = user?.role === "admin"
    ? adminLinks
    : user?.role === "customer"
      ? customerLinks
      : designerLinks;

  /* ── HORIZONTAL LAYOUT ── */
  if (layoutMode === "horizontal") {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        {/* Top Nav */}
        <header className="h-16 glass-panel border-b border-border sticky top-0 z-50 flex items-center px-6 gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2 mr-4">
            <img
              src="/logo.png"
              alt="Design Manager"
              className="h-10 w-auto object-contain"
            />
          </div>

          {/* Nav Links */}
          <nav className="flex items-center gap-1 flex-1">
            {links.map((link) => {
              const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
              return (
                <Link key={link.name} href={link.href}>
                  <div className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                    }`}>
                    {isActive && (
                      <motion.div
                        layoutId="nav-active"
                        className="absolute inset-0 bg-primary/20 border border-primary/30 rounded-xl z-0"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    <link.icon className="w-4 h-4 relative z-10" />
                    <span className="relative z-10 hidden sm:inline">{link.name}</span>
                    {(link as any).badge > 0 && (
                      <span className="relative z-10 ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-red-500 text-white">{(link as any).badge}</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* User + Logout */}
          <div className="flex items-center gap-3 ml-auto">
            <Link href="/dashboard/account">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${pathname.startsWith("/dashboard/account") ? "bg-primary/20 border border-primary/30" : "hover:bg-foreground/5"
                }`}>
                <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center font-bold text-primary text-xs overflow-hidden">
                  {user.avatar_url
                    ? <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                    : user.full_name?.charAt(0).toUpperCase() || "U"}
                </div>
                <span className="text-sm text-foreground/80 hidden md:block">{user.full_name}</span>
              </div>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-400/10"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
          {children}
        </main>
      </div>
    );
  }

  /* ── VERTICAL LAYOUT (default) ── */
  return (
    <div className="min-h-screen flex bg-background/50 p-4 gap-4">
      {/* Sidebar - Floating Island Style */}
      <aside className="w-64 glass-panel flex-col hidden md:flex sticky top-4 h-[calc(100vh-2rem)] rounded-[2rem] overflow-hidden shadow-2xl z-40">
        <div className="h-20 flex items-center justify-center px-6 border-b border-border/50">
          <img
            src="/logo.png"
            alt="Design Manager"
            className="h-12 w-auto object-contain"
          />
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {links.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
            return (
              <Link key={link.name} href={link.href}>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative group overflow-hidden ${isActive ? "text-foreground" : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"}`}>
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 bg-primary/20 border border-primary/30 rounded-xl z-0"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <link.icon className="w-5 h-5 relative z-10" />
                  <span className="font-medium relative z-10 flex-1">{link.name}</span>
                  {(link as any).badge > 0 && (
                    <span className="relative z-10 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-red-500 text-white">{(link as any).badge}</span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>


        <div className="p-4 border-t border-border/50 bg-background/20 backdrop-blur-md flex flex-col gap-2">
          <Link href="/dashboard/account">
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative group overflow-hidden cursor-pointer ${pathname.startsWith("/dashboard/account") ? "bg-primary/20 border border-primary/30" : "hover:bg-foreground/5"
              }`}>
              <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center font-bold text-primary shrink-0 overflow-hidden">
                {user.avatar_url
                  ? <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                  : user.full_name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground/90 truncate">{user.full_name}</p>
                <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                {user?.role === "customer" && customerBalance !== null && (
                  <p className="text-[11px] text-primary font-semibold mt-0.5">
                    ${customerBalance.toFixed(2)}
                  </p>
                )}
              </div>
              <UserCircle2 className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            </div>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative group overflow-hidden cursor-pointer hover:bg-red-500/10"
          >
            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-muted-foreground group-hover:text-red-400 group-hover:border-red-500/20 shrink-0 transition-colors">
              <LogOut className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="font-medium text-sm text-foreground/70 group-hover:text-red-400 transition-colors">Logout</p>
            </div>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="md:hidden h-16 glass-panel rounded-2xl mb-4 z-40 flex items-center justify-between px-6 shadow-lg">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
              <Palette className="w-4 h-4 text-white" />
            </div>
            <h1 className="font-bold text-foreground/90">DesignManager</h1>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-400/10 font-medium"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </header>

        <main className="flex-1 relative overflow-y-auto w-full pb-10">
          {children}
        </main>
      </div>
    </div>
  );
}
