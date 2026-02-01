"use client";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { data: session } = useSession();

  const handleGetStarted = () => {
    if (session?.user?.id) {
      router.push("/jobs");
    } else {
      router.push("/sign-in");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5 pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center space-y-8 max-w-3xl mx-auto">


            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              Land Your Dream Job
              <span className="block text-primary mt-2">
                While You Sleep
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Let our AI match you with perfect opportunities and apply automatically—24/7.
            </p>



          </div>
        </div>
      </section>

      {/* Dashboard Preview - Half Below Fold */}
      <section className="relative pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative">
            <Card className="overflow-hidden border-2 shadow-2xl">
              <div className="relative w-full" style={{ height: '600px' }}>
                <Image
                  src="/image.png"
                  alt="AutoJob Dashboard"
                  fill
                  className="object-cover object-top"
                  priority
                />
              </div>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
