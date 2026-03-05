"use client";

import { useEffect, useState } from "react";
import AdminView from "@/components/dashboard/AdminView";
import DesignerOverview from "@/components/dashboard/DesignerOverview";
import CustomerView from "@/components/dashboard/CustomerView";
import BroadcastBanner from "@/components/dashboard/BroadcastBanner";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  if (!user) return null;

  return (
    <>
      <BroadcastBanner />
      {user.role === "admin" ? (
        <AdminView />
      ) : user.role === "customer" ? (
        <CustomerView user={user} />
      ) : (
        <DesignerOverview user={user} />
      )}
    </>
  );
}
