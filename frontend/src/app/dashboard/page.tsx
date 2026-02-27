"use client";

import { useEffect, useState } from "react";
import AdminView from "@/components/dashboard/AdminView";
import DesignerOverview from "@/components/dashboard/DesignerOverview";

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
      {user.role === "admin" ? <AdminView /> : <DesignerOverview user={user} />}
    </>
  );
}
