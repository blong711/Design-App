"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LogOut, Palette, LayoutDashboard, Ticket, Settings, Activity, Users } from "lucide-react";
import { motion } from "framer-motion";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 glass-panel flex flex-col hidden md:flex sticky top-0 h-screen">
        <div className="h-16 flex items-center gap-3 px-6 border-b border-white/10">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
            <Palette className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
            DesignManager
          </h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {links.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
            return (
              <Link key={link.name} href={link.href}>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative group overflow-hidden ${isActive ? "text-white" : "text-white/60 hover:bg-white/5 hover:text-white"}`}>
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

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5">
            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center font-bold text-primary">
              {user.full_name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
               <p className="font-medium text-sm text-white/90 truncate">{user.full_name}</p>
               <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 border-b border-white/10 glass-panel sticky top-0 z-50 flex items-center justify-between px-6 md:justify-end">
           {/* Mobile Title (hidden on desktop) */}
           <div className="flex items-center gap-2 md:hidden">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center">
                <Palette className="w-4 h-4 text-white" />
              </div>
              <h1 className="font-bold text-white/90">DesignManager</h1>
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
