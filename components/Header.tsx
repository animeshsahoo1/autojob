"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { UserCircle2 } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { logout } from "@/lib/actions/auth";

const Header = () => {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [profileDropdown, setProfileDropdown] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const navigate = (path: string) => {
    router.push(path);
  };
  const pathname = usePathname();

  // --- SCROLL LOGIC START ---
  const [isVisible, setIsVisible] = useState(true);
  const [isAtTop, setIsAtTop] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // 1. Determine if we are at the very top (allow 10px buffer)
      if (currentScrollY < 10) {
        setIsAtTop(true);
        // Always show header when at the very top
        setIsVisible(true);
      } else {
        setIsAtTop(false);
        // 2. Determine scroll direction
        if (currentScrollY > lastScrollY.current) {
          // Scrolling DOWN -> Hide Header
          setIsVisible(false);
        } else {
          // Scrolling UP -> Show Header
          setIsVisible(true);
        }
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  // Scroll detection for navbar transparency
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/95 backdrop-blur-md border-b"
          : "bg-background/80 backdrop-blur-sm"
      }`}
    >
      {" "}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-10 py-4 flex items-center justify-between">
        {/* LOGO SECTION */}
        <Link
          href="/"
          className="text-2xl md:text-3xl font-bold text-white hover:text-blue-400 transition-colors"
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
                <div className="absolute top-full right-0 mt-2 w-48 bg-gray-900 rounded-lg shadow-xl border border-white/10 py-2 z-50">
                  <button
                    onClick={() => {
                      setProfileDropdown(false);
                      navigate("/dashboard");
                    }}
                    className="w-full px-4 py-2 cursor-pointer text-left text-white hover:bg-white/10 transition-colors"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={async () => {
                      setProfileDropdown(false);
                      await logout();
                    }}
                    className="w-full px-4 cursor-pointer py-2 text-left text-red-400 hover:bg-white/10 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => navigate("/sign-in")}
              className="px-6 py-2 bg-blue-600 cursor-pointer text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
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
