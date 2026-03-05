"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";

import { Suspense } from "react";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link. No token provided.");
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await api.post(`/auth/verify-email?token=${token}`);
        setStatus("success");
        setMessage(response.data.message || "Email verified successfully!");

        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } catch (error: any) {
        setStatus("error");
        setMessage(
          error.response?.data?.detail ||
          "Failed to verify email. The link may be invalid or expired."
        );
      }
    };

    verifyEmail();
  }, [token, router]);

  return (
    <div className="flex flex-col items-center text-center space-y-4">
      {status === "loading" && (
        <>
          <Loader2 className="w-16 h-16 text-pink-500 animate-spin" />
          <h1 className="text-2xl font-bold text-gray-900">Verifying your email...</h1>
          <p className="text-gray-500">Please wait while we confirm your email address.</p>
        </>
      )}

      {status === "success" && (
        <>
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Email Verified!</h1>
          <p className="text-gray-600">{message}</p>
          <p className="text-sm text-gray-500">Redirecting to login page...</p>
          <Link
            href="/login"
            className="mt-4 inline-flex items-center justify-center px-6 py-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold hover:from-pink-600 hover:to-purple-600 transition-all duration-200"
          >
            Go to Login
          </Link>
        </>
      )}

      {status === "error" && (
        <>
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <XCircle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Verification Failed</h1>
          <p className="text-gray-600">{message}</p>
          <div className="flex flex-col gap-2 w-full mt-4">
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold hover:from-pink-600 hover:to-purple-600 transition-all duration-200"
            >
              Register Again
            </Link>
            <Link
              href="/login"
              className="text-sm text-pink-500 hover:underline"
            >
              Back to Login
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#111116" }}>
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <Suspense fallback={
            <div className="flex flex-col items-center text-center space-y-4">
              <Loader2 className="w-16 h-16 text-pink-500 animate-spin" />
              <h1 className="text-2xl font-bold text-gray-900">Loading...</h1>
            </div>
          }>
            <VerifyEmailContent />
          </Suspense>
        </div>

        <div className="text-center mt-8">
          <p className="text-xs text-gray-500">
            © 2026 Design Manager. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

