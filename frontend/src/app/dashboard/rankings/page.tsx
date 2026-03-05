"use client";

import { useEffect, useState } from "react";
import RankingsView from "@/components/dashboard/RankingsView";

export default function RankingsPage() {
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    if (!user) return null;

    return (
        <div className="max-w-7xl mx-auto px-6 py-10">
            <RankingsView />
        </div>
    );
}
