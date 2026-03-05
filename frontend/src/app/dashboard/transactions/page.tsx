"use client";

import { useEffect, useState } from "react";
import TransactionsView from "@/components/dashboard/TransactionsView";

export default function TransactionsPage() {
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    if (!user) return null;

    return <TransactionsView isAdmin={user.role === "admin"} />;
}
