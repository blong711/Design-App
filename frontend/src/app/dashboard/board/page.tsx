"use client";

import { useEffect, useState } from "react";
import DesignerView from "@/components/dashboard/DesignerView";

export default function DesignerBoardPage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  if (!user || user.role !== "designer") return null;

  return (
    <div className="h-full">
      <DesignerView user={user} />
    </div>
  );
}
