"use client";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { User, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/providers/AuthProvider";
import { useState, useEffect } from "react";
import LastFmDashboard from "./lastfm/page";
import SpotifyDashboard from "./spotify/page";

const DashboardPage = () => {
  const { logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"lastfm" | "spotify">("lastfm");

  useEffect(() => {
    const savedTab = localStorage.getItem("onPage") as "lastfm" | "spotify";
    if (savedTab) {
      setActiveTab(savedTab);
    }
    setMounted(true);
  }, []);

  const handleTabChange = (tab: "lastfm" | "spotify") => {
    setActiveTab(tab);
    localStorage.setItem("onPage", tab);
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="h-screen bg-background">
      <div className="border-b">
        <header className="container px-6 sm:px-8 flex h-16 items-center mx-auto">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-semibold">GrayKnight</h1>
            <nav className="flex items-center gap-6">
              <Button
                variant={activeTab === "spotify" ? "default" : "ghost"}
                className={`text-green-600 ${
                  activeTab === "spotify"
                    ? "shadow-[0_0_10px_rgba(0,255,0,0.5)]"
                    : ""
                }`}
                onClick={() => handleTabChange("spotify")}
              >
                Spotify
              </Button>
              <Button
                variant={activeTab === "lastfm" ? "default" : "ghost"}
                className={`text-red-600 ${
                  activeTab === "lastfm"
                    ? "shadow-[0_0_10px_rgba(255,0,0,0.5)]"
                    : ""
                }`}
                onClick={() => handleTabChange("lastfm")}
              >
                Last.fm
              </Button>
            </nav>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuItem onClick={logout} className="text-red-500">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
      </div>

      <main className="container px-4 sm:px-6 md:px-8 py-6 md:py-8 mx-auto">
        {activeTab === "lastfm" ? <LastFmDashboard /> : <SpotifyDashboard />}
      </main>
    </div>
  );
};

export default DashboardPage;
