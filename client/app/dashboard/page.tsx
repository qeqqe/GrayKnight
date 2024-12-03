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
import { useState } from "react";
import LastFmDashboard from "./lastfm/page";
import SpotifyDashboard from "./spotify/page";

const DashboardPage = () => {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'lastfm' | 'spotify'>('lastfm');

  return (
    <div className="h-screen bg-background">
      <div className="border-b">
        <header className="container flex h-16 items-center px-4">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-semibold">GrayKnight</h1>
            <nav className="hidden md:flex items-center gap-6">
                <Button
                variant={activeTab === 'lastfm' ? 'default' : 'ghost'}
                className={`text-red-600 ${activeTab === 'lastfm' ? 'shadow-[0_0_10px_rgba(255,0,0,0.5)]' : ''}`}
                onClick={() => setActiveTab('lastfm')}
                >
                Last.fm
                </Button>
                <Button
                variant={activeTab === 'spotify' ? 'default' : 'ghost'}
                className={`text-green-600 ${activeTab === 'spotify' ? 'shadow-[0_0_10px_rgba(0,255,0,0.5)]' : ''}`}
                onClick={() => setActiveTab('spotify')}
                >
                Spotify
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

      <main className="container p-4 md:p-8">
        {activeTab === 'lastfm' ? <LastFmDashboard /> : <SpotifyDashboard />}
      </main>
    </div>
  );
};

export default DashboardPage;