"use client";

import { useEffect, useState } from "react";
import BrandKitManager from "@/components/dashboard/BrandKitManager";

export default function BrandKitPage() {
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    if (!user) return null;

    return (
        <div className="max-w-7xl mx-auto px-6 py-10 scale-in-sm duration-500">
            <BrandKitManager />
        </div>
    );
}
