"use client";

import { useEffect, useState } from "react";
import CustomerView from "@/components/dashboard/CustomerView";

export default function MyDesignsPage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  if (!user) return null;

  return <CustomerView user={user} initialView="dashboard" />;
}
