"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Mail, Lock } from "lucide-react";
import { signUp } from "@/lib/actions/auth";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

// --- Assets ---
import leftgirl from "@/public/assets/leftgirl.svg";
import rightgirl from "@/public/assets/rightGirl.svg";
import middlegirl from "@/public/assets/middlegirl.svg";

// Blobs
import yellowBlob from "@/public/assets/yelo.svg";
import tealBlob from "@/public/assets/Star 19.svg";
import yellowRectBlob from "@/public/assets/yellow_rectangle.svg";

const SignInPage = () => {
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
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
    <div className="min-h-screen w-full bg-white font-sans selection:bg-purple-100">
      <div className="relative w-full bg-gradient-to-b from-[#DABCFC] to-[#FFFFFF] pt-16 md:pt-24 pb-12 overflow-x-hidden">
        {/* Main Content Container (Wider max-w-6xl to allow spacing) */}
        <div className="relative w-full max-w-6xl mx-auto flex flex-col items-center px-4">
          <div className="absolute left-4 top-0 w-12 lg:w-16 -rotate-12 hidden lg:block opacity-90 drop-shadow-[6px_8px_1px_rgba(0,0,0,0.25)]">
            <Image src={yellowBlob} alt="" className="w-full h-auto" />
          </div>

          {/* Left Girl - Middle Left */}
          <div className="absolute left-4 lg:-left-16 top-32 w-32 lg:w-48 hidden lg:block animate-in fade-in slide-in-from-left-8 duration-1000">
            <Image
              src={leftgirl}
              alt="Left Girl"
              className="w-full h-auto object-contain"
            />
          </div>

          {/* Teal Blob - Bottom Left */}
          {/* Updated shadow: Harder edge (2px blur), significant offset towards top-right */}
          <div className="absolute left-20 lg:left-28 -bottom-12 w-12 lg:w-20 hidden lg:block opacity-90 drop-shadow-[8px_-8px_2px_rgba(0,0,0,0.25)]">
            <Image src={tealBlob} alt="" className="w-full h-auto" />
          </div>

          {/* 2. RIGHT SIDE ELEMENTS */}

          {/* Yellow Rect Blob - Middle Right (Now at top right position) */}
          {/* Updated shadow: Harder edge (2px blur), significant offset towards bottom-left */}
          <div className="absolute right-4 lg:-right-10 -top-8 w-12 lg:w-14 rotate-[15deg] hidden lg:block opacity-90 drop-shadow-[-8px_8px_2px_rgba(0,0,0,0.25)]">
            <Image src={yellowRectBlob} alt="" className="w-full h-auto" />
          </div>

          {/* Top Right Girl (Middle Girl in import) - Now at middle right */}
          <div className="absolute right-32 lg:right-40 top-16 w-28 lg:w-40 hidden lg:block animate-in fade-in slide-in-from-right-8 duration-1000 delay-100">
            <Image
              src={middlegirl}
              alt="Top Right Girl"
              className="w-full h-auto object-contain"
            />
          </div>

          {/* Bottom Right Girl - Lower Right */}
          <div className="absolute right-4 lg:-right-20 -bottom-4 w-32 lg:w-52 hidden lg:block animate-in fade-in slide-in-from-right-8 duration-1000 delay-200">
            <Image
              src={rightgirl}
              alt="Right Girl"
              className="w-full h-auto object-contain"
            />
          </div>

          {/* --- CENTER TEXT & GOOGLE BTN --- */}
          <div className="relative z-10 flex flex-col items-center text-center w-full max-w-md mt-4">
            {/* Title */}
            <h1 className="text-4xl md:text-6xl font-bold italic text-black mb-4 drop-shadow-sm">
              LesSkyn
            </h1>

            {/* Subtitle */}
            <p className="text-gray-700 text-base md:text-lg mb-10 max-w-xs md:max-w-sm leading-relaxed">
              Welcome back! Log in to continue your skincare journey
            </p>

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
              className="w-full flex items-center justify-center gap-3 bg-white border-2 border-[#DABCFC] rounded-xl py-3 px-4 text-black font-semibold hover:bg-purple-50 transition-colors shadow-sm mb-8 group"
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
            <div className="w-full flex items-center gap-4 mb-2">
              <div className="h-px bg-gray-300 flex-1"></div>
              <span className="text-gray-500 text-sm pb-1">or</span>
              <div className="h-px bg-gray-300 flex-1"></div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= BOTTOM SECTION (Form Inputs) ================= */}
      <div className="w-full bg-white pb-20">
        <div className="w-full max-w-md mx-auto px-4 flex flex-col items-center">
          <form className="w-full flex flex-col gap-6 text-left">
            {/* Username Input */}
            <div>
              <label
                htmlFor="userName"
                className="block text-xl font-semibold text-black mb-2"
              >
                Username
              </label>
              <div className="relative group">
                <input
                  id="userName"
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter your Username"
                  className="w-full bg-[#F3F0FF] border border-transparent focus:border-purple-400 focus:bg-white rounded-lg py-4 pl-4 pr-4 text-black placeholder-gray-400 outline-none transition-all font-medium"
                />
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label
                htmlFor="email"
                className="block text-xl font-semibold text-black mb-2"
              >
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-500 group-focus-within:text-purple-600 transition-colors" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your Email"
                  className="w-full bg-[#F3F0FF] border border-transparent focus:border-purple-400 focus:bg-white rounded-lg py-4 pl-12 pr-4 text-black placeholder-gray-400 outline-none transition-all font-medium"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label
                htmlFor="password"
                className="block text-xl font-semibold text-black mb-2"
              >
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-500 group-focus-within:text-purple-600 transition-colors" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your Password"
                  className="w-full bg-[#F3F0FF] border border-transparent focus:border-purple-400 focus:bg-white rounded-lg py-4 pl-12 pr-4 text-black placeholder-gray-400 outline-none transition-all font-medium"
                />
              </div>
            </div>

            {/* Options Row */}
            <div className="flex items-center justify-between mt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 accent-black"
                />
                <span className="text-gray-600 text-base">Remember Me</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-[#A855F7] hover:text-purple-700 font-semibold text-base"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Terms and Conditions Checkbox */}
            <div className="mt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 accent-black"
                />
                <span className="text-gray-600 text-base">
                  I have read all{" "}
                  <Link
                    href="/"
                    className="text-[#A855F7] hover:text-purple-700 font-semibold hover:underline"
                  >
                    terms and conditions
                  </Link>
                  *
                </span>
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="w-full bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Continue Button */}
            <button
              type="submit"
              disabled={isLoading || !termsAccepted}
              onClick={async (e) => {
                e.preventDefault();
                setError("");

                if (!userName || !email || !password) {
                  setError("Please fill in all fields");
                  return;
                }

                if (!termsAccepted) {
                  setError("Please accept the terms and conditions");
                  return;
                }

                setIsLoading(true);

                try {
                  const result = await signUp({ userName, email, password });

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
              className="w-full bg-black text-white rounded-xl py-4 text-lg font-bold mt-4 hover:bg-gray-900 transition-colors active:scale-[0.99] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Creating account..." : "Continue"}
            </button>
          </form>

          {/* Signup Link */}
          <p className="mt-8 text-gray-500 text-lg">
            Already have an account?{" "}
            <Link
              href="/sign-in"
              className="text-[#A855F7] font-semibold hover:underline"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
