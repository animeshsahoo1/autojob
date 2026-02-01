"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Mail, Lock, User, ArrowRight } from "lucide-react";
import { signUp } from "@/lib/actions/auth";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

const SignUpPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "OAuthAccountNotLinked") {
      setError(
        "This email is already registered with email/password. Please sign in using your password.",
      );
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white pt-20">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative max-w-md mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Create Account</h1>
          <p className="text-gray-400">Start your automated job search</p>
        </div>

        {/* Sign-up Card */}
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 shadow-2xl">
          {/* Google Button */}
          <button
            onClick={async () => {
              try {
                await signIn("google", { callbackUrl: "/dashboard" });
              } catch (error) {
                console.error("Google sign in error:", error);
                setError("Failed to sign in with Google");
              }
            }}
            type="button"
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-black rounded-lg py-3 px-4 font-medium transition-all mb-6 group"
          >
            <svg
              className="w-6 h-6 group-hover:scale-110 transition-transform"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="w-full flex items-center gap-4 mb-6">
            <div className="h-px bg-white/20 flex-1"></div>
            <span className="text-gray-400 text-sm">or</span>
            <div className="h-px bg-white/20 flex-1"></div>
          </div>

          {/* Form */}
          <form className="w-full space-y-5">
            {/* Name Input */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-white/10 border border-white/20 focus:border-blue-500 rounded-lg py-3 pl-10 pr-4 text-white placeholder-gray-400 outline-none transition-all"
                />
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-white/10 border border-white/20 focus:border-blue-500 rounded-lg py-3 pl-10 pr-4 text-white placeholder-gray-400 outline-none transition-all"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/10 border border-white/20 focus:border-blue-500 rounded-lg py-3 pl-10 pr-4 text-white placeholder-gray-400 outline-none transition-all"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              onClick={async (e) => {
                e.preventDefault();
                setError("");

                if (!name || !email || !password) {
                  setError("Please fill in all fields");
                  return;
                }

                setIsLoading(true);

                try {
                  const result = await signUp({
                    userName: name,
                    email,
                    password,
                  });
                  if (result.success) {
                    router.push("/dashboard");
                  } else {
                    setError(result.error || "Failed to sign up");
                  }
                } catch (err) {
                  setError("An unexpected error occurred");
                } finally {
                  setIsLoading(false);
                }
              }}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg py-3 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group mt-2"
            >
              {isLoading ? "Creating account..." : "Create Account"}
              {!isLoading && (
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              )}
            </button>
          </form>

          {/* Sign in link */}
          <p className="mt-6 text-center text-gray-400">
            Already have an account?{" "}
            <Link
              href="/sign-in"
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
