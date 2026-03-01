"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LogOut, Palette, LayoutDashboard, Ticket, Settings, Activity, Users, UserCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { useSettings } from "@/lib/settings-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { layoutMode } = useSettings();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const storedUser = localStorage.getItem("user");
    if (!token || !storedUser) {
      router.push("/login");
      return;
    }
    setUser(JSON.parse(storedUser));
    setLoading(false);
  }, [router]);

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
    { name: "All Tickets", href: "/dashboard/tickets", icon: Ticket },
    { name: "Users", href: "/dashboard/users", icon: Users },
    { name: "API Keys", href: "/dashboard/api-keys", icon: Settings },
  ];

  const designerLinks = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Kanban Board", href: "/dashboard/board", icon: Activity },
  ];

  const links = user?.role === "admin" ? adminLinks : designerLinks;

  /* ── HORIZONTAL LAYOUT ── */
  if (layoutMode === "horizontal") {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        {/* Top Nav */}
        <header className="h-16 glass-panel border-b border-border sticky top-0 z-50 flex items-center px-6 gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2 mr-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
              <Palette className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-base font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60 hidden sm:block">
              DesignManager
            </h1>
          </div>

          {/* Nav Links */}
          <nav className="flex items-center gap-1 flex-1">
            {links.map((link) => {
              const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
              return (
                <Link key={link.name} href={link.href}>
                  <div className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
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
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* User + Logout */}
          <div className="flex items-center gap-3 ml-auto">
            <Link href="/dashboard/account">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                pathname.startsWith("/dashboard/account") ? "bg-primary/20 border border-primary/30" : "hover:bg-foreground/5"
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
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border glass-panel flex flex-col hidden md:flex sticky top-0 h-screen">
        <div className="h-16 flex items-center gap-3 px-6 border-b border-border">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
            <Palette className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60">
            DesignManager
          </h1>
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
                  <span className="font-medium relative z-10">{link.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <Link href="/dashboard/account">
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative group overflow-hidden cursor-pointer ${
              pathname.startsWith("/dashboard/account") ? "bg-primary/20 border border-primary/30" : "hover:bg-foreground/5"
            }`}>
              <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center font-bold text-primary shrink-0 overflow-hidden">
                {user.avatar_url
                  ? <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                  : user.full_name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground/90 truncate">{user.full_name}</p>
                <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
              </div>
              <UserCircle2 className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            </div>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 border-b border-border glass-panel sticky top-0 z-50 flex items-center justify-between px-6 md:justify-end">
          <div className="flex items-center gap-2 md:hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center">
              <Palette className="w-4 h-4 text-white" />
            </div>
            <h1 className="font-bold text-foreground/90">DesignManager</h1>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-400/10"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </header>

        <main className="flex-1 p-6 lg:p-10 relative overflow-y-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
