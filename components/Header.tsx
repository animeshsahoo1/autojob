"use client";
import { useRouter } from "next/navigation";
import { FileText, Upload, LogOut, Briefcase, History, User } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { logout } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const { data: session } = useSession();
  const router = useRouter();

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 left-0 right-0 z-50 bg-neutral-950 border-b border-neutral-800">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-10 py-2 flex items-center justify-between">
        {/* LOGO SECTION */}
        <Link
          href="/"
          className="text-xl md:text-2xl font-bold text-white hover:text-neutral-300 transition-colors"
        >
          autojob
        </Link>

        {/* RIGHT SIDE - LOGIN/PROFILE */}
        <div className="flex items-center gap-4">
          {session?.user?.id ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={session.user.image || ""} alt={session.user.name || "User"} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{session.user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {session.user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => router.push("/jobs")}>
                    <Briefcase className="mr-2 h-4 w-4" />
                    Browse Jobs
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/logs")}>
                    <History className="mr-2 h-4 w-4" />
                    Activity Logs
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => router.push("/resume")}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Resume
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/my-resumes")}>
                    <FileText className="mr-2 h-4 w-4" />
                    My Resumes
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    await logout();
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={() => router.push("/sign-in")} variant="secondary">
              Login
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
