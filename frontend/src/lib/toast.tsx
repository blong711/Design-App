"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextValue {
    toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const toast = useCallback((message: string, type: ToastType = "info") => {
        const id = Math.random().toString(36).slice(2);
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
    }, []);

    const remove = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className="pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-md animate-in slide-in-from-right-4 fade-in duration-300 min-w-[280px] max-w-[380px]"
                        style={{
                            background:
                                t.type === "success"
                                    ? "rgba(22,101,52,0.85)"
                                    : t.type === "error"
                                        ? "rgba(127,29,29,0.85)"
                                        : "rgba(30,27,75,0.85)",
                            borderColor:
                                t.type === "success"
                                    ? "rgba(74,222,128,0.4)"
                                    : t.type === "error"
                                        ? "rgba(248,113,113,0.4)"
                                        : "rgba(167,139,250,0.4)",
                        }}
                    >
                        {t.type === "success" && <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />}
                        {t.type === "error" && <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />}
                        {t.type === "info" && <Info className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />}
                        <p className="text-sm text-white flex-1 leading-relaxed">{t.message}</p>
                        <button onClick={() => remove(t.id)} className="text-white/50 hover:text-white transition-colors shrink-0">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used inside ToastProvider");
    return ctx.toast;
}
