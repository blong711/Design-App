"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    setLoading(true);
    setError("");

    try {
      const formData = new URLSearchParams();
      formData.append("username", username);
      formData.append("password", password);

      const res = await api.post("/auth/login", formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      localStorage.setItem("access_token", res.data.access_token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { tag: "PRINT ON DEMAND", label: "Design Studio" },
    { tag: "HIGH QUALITY", label: "Artwork Export" },
    { tag: "SMART TOOLS", label: "Template Library" },
    { tag: "FAST DELIVERY", label: "Order Fulfillment" },
  ];

  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* ── Left Panel ── */}
      <div
        className="hidden lg:flex flex-col justify-between flex-1 px-16 py-14 relative overflow-hidden"
        style={{ background: "#111116" }}
      >
        {/* Subtle glow blobs */}
        <div
          className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full opacity-20 pointer-events-none"
          style={{ background: "radial-gradient(circle, #c026d3 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)" }}
        />

        {/* Top badge */}
        <div
          className={`transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}
        >
          <span
            className="inline-flex items-center gap-2 border border-white/20 rounded-full px-4 py-1.5 text-xs font-semibold tracking-widest text-white/70"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-pink-500 inline-block" />
            CREATIVE DESIGN PLATFORM
          </span>
        </div>

        {/* Main copy */}
        <div
          className={`transition-all duration-700 delay-100 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
        >
          <h1 className="text-5xl font-extrabold leading-tight text-white mb-4">
            Where creativity
            <br />
            <span
              style={{
                background: "linear-gradient(90deg, #ec4899, #a855f7)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              meets print design
            </span>
          </h1>
          <p className="text-gray-400 text-sm max-w-sm leading-relaxed">
            Professional design management platform for creating,
            <br />
            managing and delivering stunning print-on-demand artwork.
          </p>

          {/* Feature grid */}
          <div className="grid grid-cols-2 gap-0 mt-16 max-w-md">
            {features.map((f, i) => (
              <div
                key={i}
                className={`py-6 pr-8 transition-all duration-500`}
                style={{
                  borderTop: "1px solid rgba(255,255,255,0.08)",
                  borderRight: i % 2 === 0 ? "1px solid rgba(255,255,255,0.08)" : "none",
                  transitionDelay: `${200 + i * 80}ms`,
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? "translateY(0)" : "translateY(16px)",
                }}
              >
                <p className="text-xs font-semibold tracking-widest text-gray-500 mb-1">{f.tag}</p>
                <p className="text-white font-bold text-lg">{f.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p
          className={`text-xs text-gray-600 transition-all duration-700 delay-500 ${mounted ? "opacity-100" : "opacity-0"}`}
        >
          © 2026 Design Manager Print On Demand Design. All rights reserved.&nbsp;&nbsp;•&nbsp;&nbsp;Premium Edition
        </p>
      </div>

      {/* ── Right Panel ── */}
      <div
        className="flex flex-col justify-center items-center w-full lg:w-[580px] lg:min-w-[580px] px-12 py-14"
        style={{ background: "#f5f5f7" }}
      >
        <div
          className={`w-full max-w-sm transition-all duration-700 delay-200 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          {/* Logo card */}
          <div className="flex justify-center mb-8">
            <div className="bg-white rounded-2xl shadow-lg px-8 py-5 flex items-center gap-1">
              <span className="text-3xl font-black tracking-tight text-gray-900" style={{ fontFamily: "Georgia, serif" }}>
                Design
              </span>
              <span
                className="text-3xl font-light italic ml-1"
                style={{
                  fontFamily: "Georgia, serif",
                  background: "linear-gradient(90deg, #ec4899, #a855f7)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Manager
              </span>
            </div>
          </div>

          {/* Heading */}
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-1">Welcome back!</h2>
          <p className="text-sm text-gray-500 text-center mb-8">
            Please enter your details to sign in.{" "}
            <Link href="/register" className="text-pink-500 font-medium hover:underline">
              Create account
            </Link>
          </p>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl p-3 text-center">
                {error}
              </div>
            )}

            {/* Email/Username */}
            <div>
              <label className="block text-xs font-semibold tracking-widest text-gray-400 mb-1.5 uppercase">
                Username
              </label>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-white border border-gray-200 focus:border-pink-500 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 outline-none transition-colors duration-300"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold tracking-widest text-gray-400 mb-1.5 uppercase">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-white border border-gray-200 focus:border-pink-500 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 outline-none transition-colors duration-300 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-full bg-gray-900 hover:bg-gray-800 active:scale-[0.98] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Login <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Forgot */}
          <div className="mt-6 text-center">
            <a href="#" className="text-xs text-gray-400 hover:text-pink-500 transition-colors">
              Forgot password?
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
