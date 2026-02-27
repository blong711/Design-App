"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [form, setForm] = useState({
    username: "",
    full_name: "",
    email: "",
    password: "",
    confirm_password: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!form.username.trim()) errors.username = "Username is required";
    else if (form.username.length < 3) errors.username = "Min 3 characters";
    if (!form.full_name.trim()) errors.full_name = "Full name is required";
    if (!form.email.trim()) errors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) errors.email = "Invalid email";
    if (!form.password) errors.password = "Password is required";
    else if (form.password.length < 6) errors.password = "Min 6 characters";
    if (!form.confirm_password) errors.confirm_password = "Please confirm password";
    else if (form.password !== form.confirm_password) errors.confirm_password = "Passwords do not match";
    return errors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFieldErrors({ ...fieldErrors, [e.target.name]: "" });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setLoading(true);
    setError("");
    try {
      await api.post("/auth/register", {
        username: form.username,
        full_name: form.full_name,
        email: form.email,
        password: form.password,
      });
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Registration failed. Please try again.");
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
        <div
          className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full opacity-20 pointer-events-none"
          style={{ background: "radial-gradient(circle, #c026d3 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)" }}
        />

        <div className={`transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
          <span className="inline-flex items-center gap-2 border border-white/20 rounded-full px-4 py-1.5 text-xs font-semibold tracking-widest text-white/70">
            <span className="w-1.5 h-1.5 rounded-full bg-pink-500 inline-block" />
            CREATIVE DESIGN PLATFORM
          </span>
        </div>

        <div className={`transition-all duration-700 delay-100 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <h1 className="text-5xl font-extrabold leading-tight text-white mb-4">
            Join our team of
            <br />
            <span
              style={{
                background: "linear-gradient(90deg, #ec4899, #a855f7)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              creative designers
            </span>
          </h1>
          <p className="text-gray-400 text-sm max-w-sm leading-relaxed">
            Create your account and start managing beautiful
            <br />
            print-on-demand designs from day one.
          </p>

          <div className="grid grid-cols-2 gap-0 mt-16 max-w-md">
            {features.map((f, i) => (
              <div
                key={i}
                className="py-6 pr-8 transition-all duration-500"
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

        <p className={`text-xs text-gray-600 transition-all duration-700 delay-500 ${mounted ? "opacity-100" : "opacity-0"}`}>
          © 2026 Manager Design. All rights reserved.&nbsp;&nbsp;•&nbsp;&nbsp;Premium Edition
        </p>
      </div>

      {/* ── Right Panel ── */}
      <div
        className="flex flex-col justify-center items-center w-full lg:w-[580px] lg:min-w-[580px] px-12 py-10 overflow-y-auto"
        style={{ background: "#f5f5f7" }}
      >
        <div
          className={`w-full max-w-sm transition-all duration-700 delay-200 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          {/* Logo card */}
          <div className="flex justify-center mb-6">
            <div className="bg-white rounded-2xl shadow-lg px-8 py-5 flex items-center gap-1">
              <span className="text-3xl font-black tracking-tight text-gray-900" style={{ fontFamily: "Georgia, serif" }}>
                VTN
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
                Design
              </span>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 text-center mb-1">Create account</h2>
          <p className="text-sm text-gray-500 text-center mb-6">
            Already have an account?{" "}
            <Link href="/login" className="text-pink-500 font-medium hover:underline">
              Sign in
            </Link>
          </p>

          {/* Success state */}
          {success ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-gray-800 font-semibold text-center">Account created successfully!</p>
              <p className="text-gray-400 text-sm text-center">Redirecting to login...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl p-3 text-center">
                  {error}
                </div>
              )}

              {/* Username */}
              <div>
                <label className="block text-xs font-semibold tracking-widest text-gray-400 mb-1.5 uppercase">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  placeholder="yourUsername"
                  value={form.username}
                  onChange={handleChange}
                  className={`w-full bg-white border rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 outline-none transition-colors duration-300 ${
                    fieldErrors.username ? "border-red-400 focus:border-red-400" : "border-gray-200 focus:border-pink-500"
                  }`}
                />
                {fieldErrors.username && <p className="text-red-500 text-xs mt-1">{fieldErrors.username}</p>}
              </div>

              {/* Full name */}
              <div>
                <label className="block text-xs font-semibold tracking-widest text-gray-400 mb-1.5 uppercase">
                  Full Name
                </label>
                <input
                  type="text"
                  name="full_name"
                  placeholder="Nguyen Van A"
                  value={form.full_name}
                  onChange={handleChange}
                  className={`w-full bg-white border rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 outline-none transition-colors duration-300 ${
                    fieldErrors.full_name ? "border-red-400 focus:border-red-400" : "border-gray-200 focus:border-pink-500"
                  }`}
                />
                {fieldErrors.full_name && <p className="text-red-500 text-xs mt-1">{fieldErrors.full_name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold tracking-widest text-gray-400 mb-1.5 uppercase">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="name@company.com"
                  value={form.email}
                  onChange={handleChange}
                  className={`w-full bg-white border rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 outline-none transition-colors duration-300 ${
                    fieldErrors.email ? "border-red-400 focus:border-red-400" : "border-gray-200 focus:border-pink-500"
                  }`}
                />
                {fieldErrors.email && <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold tracking-widest text-gray-400 mb-1.5 uppercase">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Min 6 characters"
                    value={form.password}
                    onChange={handleChange}
                    className={`w-full bg-white border rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 outline-none transition-colors duration-300 pr-10 ${
                      fieldErrors.password ? "border-red-400 focus:border-red-400" : "border-gray-200 focus:border-pink-500"
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
                {fieldErrors.password && <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>}
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-xs font-semibold tracking-widest text-gray-400 mb-1.5 uppercase">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    name="confirm_password"
                    placeholder="••••••••"
                    value={form.confirm_password}
                    onChange={handleChange}
                    className={`w-full bg-white border rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder-gray-300 outline-none transition-colors duration-300 pr-10 ${
                      fieldErrors.confirm_password ? "border-red-400 focus:border-red-400" : "border-gray-200 focus:border-pink-500"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.confirm_password && <p className="text-red-500 text-xs mt-1">{fieldErrors.confirm_password}</p>}
              </div>

              {/* Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-full bg-gray-900 hover:bg-gray-800 active:scale-[0.98] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Create Account <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
