"use client";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowRight, Briefcase, Zap, Target } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { data: session } = useSession();

  const handleGetStarted = () => {
    if (session?.user?.id) {
      router.push("/dashboard");
    } else {
      router.push("/sign-in");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/3 left-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "4s" }}
        ></div>
        <div
          className="absolute bottom-1/4 right-1/3 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "5s", animationDelay: "1s" }}
        ></div>
      </div>

      {/* Main content */}
      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 sm:px-6 lg:px-8 pt-20">
        {/* Hero Section */}
        <div className="max-w-5xl mx-auto text-center space-y-8 mb-16">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600/10 border border-blue-500/20 backdrop-blur-sm animate-in fade-in slide-in-from-top duration-700">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-blue-200">
              AI-Powered Job Search
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-tight animate-in fade-in slide-in-from-bottom duration-700 delay-100">
            Land Your Dream Job
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-purple-600 mt-3">
              While You Sleep
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom duration-700 delay-200">
            Stop wasting time on repetitive applications. Let our AI match you
            with perfect opportunities and apply automatically—24/7.
          </p>

          {/* CTA Button */}
          <div className="pt-6 animate-in fade-in slide-in-from-bottom duration-700 delay-300">
            <button
              onClick={handleGetStarted}
              className="group relative inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-full overflow-hidden transition-all hover:shadow-2xl hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="relative z-10">
                {session?.user?.id ? "Go to Dashboard" : "Get Started Free"}
              </span>
              <ArrowRight className="relative z-10 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>

            {!session?.user?.id && (
              <p className="mt-4 text-sm text-gray-500">
                No credit card required • Get started in 2 minutes
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
