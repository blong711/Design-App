"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useSettings } from "@/lib/settings-context";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { authLayout } = useSettings();

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

      // Trigger success animation
      setShowSuccess(true);
      setTimeout(() => {
        setTransitioning(true);
      }, 600);
      setTimeout(() => {
        router.push("/dashboard");
      }, 1400);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const carouselImages = [
    "/carousel/1.jpg",
    "/carousel/2.jpg",
    "/carousel/3.jpg",
    "/carousel/4.jpg",
    "/carousel/5.jpg",
    "/carousel/6.jpg",
  ];

  return (
    <div className="h-screen flex overflow-hidden relative">
      {/* ── Transition overlay ── */}
      {showSuccess && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          style={{ perspective: "1000px" }}
        >
          {/* Expanding circle */}
          <div
            className="absolute rounded-full"
            style={{
              width: transitioning ? "300vmax" : "0px",
              height: transitioning ? "300vmax" : "0px",
              background: "linear-gradient(135deg, #111116 0%, #1a1a2e 100%)",
              transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
          {/* Success icon */}
          <div
            className="relative z-10 flex flex-col items-center gap-3"
            style={{
              opacity: showSuccess && !transitioning ? 1 : transitioning ? 0 : 0,
              transform: showSuccess && !transitioning ? "scale(1)" : "scale(0.5)",
              transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30">
              <CheckCircle2 className="w-9 h-9 text-white" />
            </div>
            <p className="text-white font-semibold text-lg tracking-wide">Welcome!</p>
          </div>
        </div>
      )}

      {/* ── Page content with exit animation ── */}
      <div
        className={`h-screen flex overflow-hidden w-full ${authLayout === "reversed" ? "flex-row-reverse" : ""}`}
        style={{
          opacity: transitioning ? 0 : 1,
          transform: transitioning ? "scale(0.95)" : "scale(1)",
          filter: transitioning ? "blur(4px)" : "blur(0px)",
          transition: "all 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
      {/* ── Left Panel (hero) ── */}
      {authLayout !== "centered" && (
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

          {/* Image marquee */}
          <div
            className={`mt-12 overflow-hidden rounded-xl max-w-lg transition-all duration-700`}
            style={{
              transitionDelay: "300ms",
              opacity: mounted ? 1 : 0,
              transform: mounted ? "translateY(0)" : "translateY(16px)",
              maskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
              WebkitMaskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
            }}
          >
            <div className="marquee-track">
              {[...carouselImages, ...carouselImages].map((src, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-[220px] h-[150px] mx-2 rounded-lg overflow-hidden"
                >
                  <img
                    src={src}
                    alt={`Design showcase ${(i % carouselImages.length) + 1}`}
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <p
          className={`text-xs text-gray-600 transition-all duration-700 delay-500 ${mounted ? "opacity-100" : "opacity-0"}`}
        >
          © 2026 Design Manager. All rights reserved.&nbsp;&nbsp;•&nbsp;&nbsp;Premium Edition
        </p>
      </div>
      )}

      {/* ── Right Panel (form) ── */}
      <div
        className={`flex flex-col justify-center items-center px-12 py-14 ${
          authLayout === "centered"
            ? "w-full"
            : "w-full lg:w-[580px] lg:min-w-[580px]"
        }`}
        style={{ background: authLayout === "centered" ? "#111116" : "#f5f5f7" }}
      >
        <div
          className={`w-full max-w-sm transition-all duration-700 delay-200 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          {/* Logo card */}
          <div className="flex justify-center mb-8">
            <div className={`rounded-2xl shadow-lg px-8 py-6 flex items-center justify-center ${
              authLayout === "centered" ? "bg-white/10 border border-white/10" : "bg-white"
            }`}>
              <img 
                src="/logo.png" 
                alt="Design Manager" 
                className="h-16 w-auto object-contain"
              />
            </div>
          </div>

          {/* Heading */}
          <h2 className={`text-2xl font-bold text-center mb-1 ${authLayout === "centered" ? "text-white" : "text-gray-900"}`}>Welcome back!</h2>
          <p className={`text-sm text-center mb-8 ${authLayout === "centered" ? "text-gray-400" : "text-gray-500"}`}>
            Please enter your details to sign in.{" "}
            <Link href="/register" className="text-pink-500 font-medium hover:underline">
              Create account
            </Link>
          </p>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-center">{error}</p>
                {error.toLowerCase().includes("verify") && (
                  <p className="text-center mt-2">
                    <Link href="/resend-verification" className="text-pink-500 font-medium hover:underline">
                      Resend verification email →
                    </Link>
                  </p>
                )}
              </div>
            )}

            {/* Email/Username */}
            <div>
              <label className={`block text-xs font-semibold tracking-widest mb-1.5 uppercase ${authLayout === "centered" ? "text-gray-500" : "text-gray-400"}`}>
                Username
              </label>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className={`w-full border rounded-lg px-3 py-2.5 text-sm outline-none transition-colors duration-300 ${
                  authLayout === "centered"
                    ? "bg-white/10 border-white/10 text-white placeholder-gray-500 focus:border-pink-500"
                    : "bg-white border-gray-200 text-gray-800 placeholder-gray-300 focus:border-pink-500"
                }`}
              />
            </div>

            {/* Password */}
            <div>
              <label className={`block text-xs font-semibold tracking-widest mb-1.5 uppercase ${authLayout === "centered" ? "text-gray-500" : "text-gray-400"}`}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm outline-none transition-colors duration-300 pr-10 ${
                    authLayout === "centered"
                      ? "bg-white/10 border-white/10 text-white placeholder-gray-500 focus:border-pink-500"
                      : "bg-white border-gray-200 text-gray-800 placeholder-gray-300 focus:border-pink-500"
                  }`}
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
    </div>
  );
}
