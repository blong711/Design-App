"use client";

import { useState } from "react";
import { Settings, X, Sun, Moon, PanelLeft, PanelTop, Columns2, ArrowRightLeft, Maximize2 } from "lucide-react";
import { useSettings } from "@/lib/settings-context";
import { usePathname } from "next/navigation";

export function AppSettings() {
  const [open, setOpen] = useState(false);
  const { colorScheme, setColorScheme, layoutMode, setLayoutMode, authLayout, setAuthLayout } = useSettings();
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/register";

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-[9999] w-11 h-11 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
        style={{
          background: "linear-gradient(135deg, #ec4899, #a855f7)",
        }}
        title="App Settings"
      >
        {open ? (
          <X className="w-5 h-5 text-white" />
        ) : (
          <Settings className="w-5 h-5 text-white animate-[spin_6s_linear_infinite]" />
        )}
      </button>

      {/* Settings Panel */}
      <div
        className={`fixed bottom-20 right-6 z-[9998] w-64 rounded-2xl shadow-2xl border transition-all duration-300 overflow-hidden ${
          open
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-4 pointer-events-none"
        } ${
          colorScheme === "dark"
            ? "bg-[#1a1a24] border-white/10 text-white"
            : "bg-white border-gray-200 text-gray-800"
        }`}
      >
        {/* Header */}
        <div
          className="px-4 py-3 text-xs font-bold tracking-widest uppercase border-b"
          style={{
            background: "linear-gradient(135deg, #ec4899, #a855f7)",
            borderColor: "transparent",
            color: "white",
          }}
        >
          App Settings
        </div>

        <div className="p-4 space-y-5">
          {/* Color Scheme */}
          <div>
            <p className={`text-xs font-semibold tracking-widest uppercase mb-2.5 ${colorScheme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
              Color Scheme
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setColorScheme("light")}
                className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                  colorScheme === "light"
                    ? "border-pink-500 bg-pink-500/10 text-pink-500"
                    : colorScheme === "dark"
                    ? "border-white/10 text-gray-400 hover:border-white/20"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                <Sun className="w-4 h-4" />
                Light
              </button>
              <button
                onClick={() => setColorScheme("dark")}
                className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                  colorScheme === "dark"
                    ? "border-purple-500 bg-purple-500/10 text-purple-400"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                <Moon className="w-4 h-4" />
                Dark
              </button>
            </div>
          </div>

          {/* Layout Mode - only on dashboard */}
          {!isAuthPage && (
          <div>
            <p className={`text-xs font-semibold tracking-widest uppercase mb-2.5 ${colorScheme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
              Dashboard Layout
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setLayoutMode("vertical")}
                className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                  layoutMode === "vertical"
                    ? "border-pink-500 bg-pink-500/10 text-pink-500"
                    : colorScheme === "dark"
                    ? "border-white/10 text-gray-400 hover:border-white/20"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                <PanelLeft className="w-4 h-4" />
                Vertical
              </button>
              <button
                onClick={() => setLayoutMode("horizontal")}
                className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                  layoutMode === "horizontal"
                    ? "border-pink-500 bg-pink-500/10 text-pink-500"
                    : colorScheme === "dark"
                    ? "border-white/10 text-gray-400 hover:border-white/20"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                <PanelTop className="w-4 h-4" />
                Horizontal
              </button>
            </div>
          </div>
          )}

          {/* Auth Page Layout - only on login/register */}
          {isAuthPage && (
          <div>
            <p className={`text-xs font-semibold tracking-widest uppercase mb-2.5 ${colorScheme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
              Page Layout
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setAuthLayout("default")}
                className={`flex-1 flex flex-col items-center gap-1.5 py-2 rounded-xl border text-[10px] font-medium transition-all ${
                  authLayout === "default"
                    ? "border-pink-500 bg-pink-500/10 text-pink-500"
                    : colorScheme === "dark"
                    ? "border-white/10 text-gray-400 hover:border-white/20"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                <Columns2 className="w-4 h-4" />
                Default
              </button>
              <button
                onClick={() => setAuthLayout("reversed")}
                className={`flex-1 flex flex-col items-center gap-1.5 py-2 rounded-xl border text-[10px] font-medium transition-all ${
                  authLayout === "reversed"
                    ? "border-pink-500 bg-pink-500/10 text-pink-500"
                    : colorScheme === "dark"
                    ? "border-white/10 text-gray-400 hover:border-white/20"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                <ArrowRightLeft className="w-4 h-4" />
                Reversed
              </button>
              <button
                onClick={() => setAuthLayout("centered")}
                className={`flex-1 flex flex-col items-center gap-1.5 py-2 rounded-xl border text-[10px] font-medium transition-all ${
                  authLayout === "centered"
                    ? "border-pink-500 bg-pink-500/10 text-pink-500"
                    : colorScheme === "dark"
                    ? "border-white/10 text-gray-400 hover:border-white/20"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                <Maximize2 className="w-4 h-4" />
                Centered
              </button>
            </div>
          </div>
          )}
        </div>
      </div>

      {/* Backdrop (mobile) */}
      {open && (
        <div
          className="fixed inset-0 z-[9997]"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}
