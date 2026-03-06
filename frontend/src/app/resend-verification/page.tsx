"use client";

import { useState } from "react";
import { Mail, Loader2, CheckCircle } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";

export default function ResendVerificationPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await api.post(`/auth/resend-verification?email=${encodeURIComponent(email)}`);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to resend verification email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#111116" }}>
      <div className="w-full max-w-md">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl p-8 relative overflow-hidden">
          {/* Decorative glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-pink-500/20 blur-[80px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/20 blur-[80px] rounded-full pointer-events-none" />

          <div className="relative z-10">
            {success ? (
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 rounded-3xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-6">
                  <CheckCircle className="w-10 h-10 text-green-400" />
                </div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Check your email!</h1>
                <p className="text-gray-400 font-medium">
                  If an account exists with <span className="text-white font-bold">{email}</span>, we've sent a new verification link.
                </p>
                <Link
                  href="/login"
                  className="mt-4 inline-flex items-center justify-center px-6 py-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold hover:from-pink-600 hover:to-purple-600 transition-all duration-200"
                >
                  Back to Login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 rounded-2xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center mx-auto mb-6">
                    <Mail className="w-8 h-8 text-pink-400" />
                  </div>
                  <h1 className="text-3xl font-bold text-white tracking-tight">Resend Verification</h1>
                  <p className="text-gray-400 font-medium text-sm">
                    Enter your email address and we'll send you a new verification link.
                  </p>
                </div>

                {error && (
                  <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-black tracking-widest mb-2 uppercase text-gray-500 ml-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/30 transition-all duration-300 placeholder:text-gray-600"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold hover:from-pink-600 hover:to-purple-600 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Resend Verification Email"
                  )}
                </button>

                <div className="text-center text-sm">
                  <Link href="/login" className="text-pink-500 hover:underline">
                    Back to Login
                  </Link>
                  {" · "}
                  <Link href="/register" className="text-pink-500 hover:underline">
                    Create Account
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-xs font-bold tracking-widest text-gray-600 uppercase">
            © 2026 Design Manager. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
