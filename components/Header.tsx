"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { UserCircle2 } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { logout } from "@/lib/actions/auth";

const Header = () => {
  const { data: session } = useSession();
  const [profileDropdown, setProfileDropdown] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const navigate = (path: string) => {
    router.push(path);
  };

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setProfileDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 left-0 right-0 z-50 bg-neutral-950 border-b border-neutral-800">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-10 py-4 flex items-center justify-between">
        {/* LOGO SECTION */}
        <Link
          href="/"
          className="text-2xl md:text-3xl font-bold text-white hover:text-neutral-300 transition-colors"
        >
          autojob
        </Link>

        {/* RIGHT SIDE - LOGIN/PROFILE */}
        <div className="flex items-center gap-4">
          {session?.user?.id ? (
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileDropdown(!profileDropdown)}
                className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
              >
                <UserCircle2 className="w-8 h-8 text-white" strokeWidth={1.5} />
              </button>

              {/* Profile Dropdown */}
              {profileDropdown && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-neutral-900 rounded-lg shadow-xl border border-neutral-800 py-2 z-50">
                  <button
                    onClick={() => {
                      setProfileDropdown(false);
                      navigate("/dashboard");
                    }}
                    className="w-full px-4 py-2 cursor-pointer text-left text-white hover:bg-neutral-800 transition-colors"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => {
                      setProfileDropdown(false);
                      navigate("/applied");
                    }}
                    className="w-full px-4 py-2 cursor-pointer text-left text-white hover:bg-neutral-800 transition-colors"
                  >
                    Applied Jobs
                  </button>
                  <button
                    onClick={async () => {
                      setProfileDropdown(false);
                      await logout();
                    }}
                    className="w-full px-4 cursor-pointer py-2 text-left text-red-400 hover:bg-neutral-800 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => navigate("/sign-in")}
              className="px-6 py-2 bg-white text-neutral-900 rounded-lg font-semibold hover:bg-neutral-200 transition-colors cursor-pointer"
            >
              Login
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
