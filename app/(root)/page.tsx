import { auth } from "@/auth";
import { ArrowRight, Briefcase, Zap, Target } from "lucide-react";
import Link from "next/link";

export default async function Home() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-blue-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Main content */}
      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 sm:px-6 lg:px-8 pt-20">
        {/* Hero Section */}
        <div className="max-w-5xl mx-auto text-center space-y-8 mb-16">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600/20 border border-blue-500/30 backdrop-blur-sm">
            <Zap className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-blue-300">
              Automated Job Applications
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
            Land Your Dream Job
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 mt-2">
              While You Sleep
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl sm:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Let AI handle the job search. Smart matching, automated
            applications, and personalized resumes—all on autopilot.
          </p>

          {/* CTA Buttons */}
          <div className="pt-8 flex flex-col sm:flex-row gap-4 items-center justify-center">
            <Link
              href="/jobs"
              className="group relative inline-flex items-center gap-3 px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-full overflow-hidden transition-all hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/50"
            >
              <span className="relative z-10">View Jobs</span>
              <Briefcase className="relative z-10 w-5 h-5" />
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </Link>

            <Link
              href={session?.user?.id ? "/dashboard" : "/sign-in"}
              className="group relative inline-flex items-center gap-3 px-8 py-4 text-lg font-semibold text-white border-2 border-white/20 rounded-full overflow-hidden transition-all hover:scale-105 hover:border-blue-500/50"
            >
              <span className="relative z-10">
                {session?.user?.id ? "Dashboard" : "Sign In"}
              </span>
              <ArrowRight className="relative z-10 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>

            {!session?.user?.id && (
              <p className="mt-4 text-sm text-gray-500 text-center w-full">
                No credit card required • Get started in 2 minutes
              </p>
            )}
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto w-full mt-12">
          {/* Feature 1 */}
          <div className="group p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-blue-500/50 transition-all">
            <div className="w-12 h-12 rounded-lg bg-blue-600/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Target className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Smart Matching</h3>
            <p className="text-gray-400">
              AI analyzes your profile and matches you with the best
              opportunities
            </p>
          </div>

          {/* Feature 2 */}
          <div className="group p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-purple-500/50 transition-all">
            <div className="w-12 h-12 rounded-lg bg-purple-600/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Briefcase className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Auto Apply</h3>
            <p className="text-gray-400">
              Automatically apply to jobs that match your criteria 24/7
            </p>
          </div>

          {/* Feature 3 */}
          <div className="group p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-blue-500/50 transition-all">
            <div className="w-12 h-12 rounded-lg bg-blue-600/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Resume Variants</h3>
            <p className="text-gray-400">
              Multiple resume versions tailored for different job types
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
