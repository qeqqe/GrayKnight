"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SiLastdotfm } from "react-icons/si";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Calendar,
  Clock,
  Disc,
  HeartPulse,
  Music2,
  User,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/providers/AuthProvider";

export default function DashboardPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const { logout } = useAuth();

  useEffect(() => {
    const checkLastFmStatus = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          "http://localhost:3001/api/lastfm/status",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await response.json();
        setIsConnected(data.connected);
        setDebugInfo(data);
      } catch (error) {
        console.error("Failed to check Last.fm status:", error);
      }
    };

    // Check status on mount and when URL has success parameter
    if (window.location.search.includes("success=true")) {
      checkLastFmStatus();
    }
  }, []);

  const handleLastFmConnect = () => {
    const token = localStorage.getItem("token"); // or however you store your JWT
    window.location.href = `http://localhost:3001/auth/lastfm`;

    // Alternative using fetch:
    // fetch('http://localhost:3001/auth/lastfm', {
    //   headers: {
    //     'Authorization': `Bearer ${token}`
    //   }
    // }).then(response => {
    //   window.location.href = response.url;
    // });
  };

  return (
    <div className="h-screen bg-background">
      <div className="border-b">
        <header className="container flex h-16 items-center px-4">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-semibold">GrayKnight</h1>
            <nav className="hidden md:flex items-center gap-6">
              <Button
                variant="ghost"
                className="text-muted-foreground hover:text-foreground"
              >
                Overview
              </Button>
              <Button
                variant="ghost"
                className="text-muted-foreground hover:text-foreground"
              >
                Library
              </Button>
              <Button
                variant="ghost"
                className="text-muted-foreground hover:text-foreground"
              >
                Statistics
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

      <main className="container p-4 md:p-8 space-y-8">
        {debugInfo && (
          <Card className="mb-4 bg-muted">
            <CardHeader>
              <CardTitle>Debug Information</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm overflow-auto p-4">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {!isConnected ? (
          <Card className="border-dashed">
            <CardHeader className="text-center">
              <CardTitle>Connect Your Last.fm Account</CardTitle>
              <CardDescription>
                Connect your Last.fm account to start tracking your music
                journey
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center pb-6">
              <Button size="lg" className="gap-2" onClick={handleLastFmConnect}>
                <SiLastdotfm size={20} />
                Connect with Last.fm
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="recent">Recent</TabsTrigger>
              <TabsTrigger value="artists">Top Artists</TabsTrigger>
              <TabsTrigger value="tracks">Top Tracks</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      Scrobbles Today
                    </CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">24</div>
                    <p className="text-xs text-muted-foreground">
                      +2 from last hour
                    </p>
                    <Progress value={33} className="mt-3" />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      Weekly Artists
                    </CardTitle>
                    <Music2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">12</div>
                    <p className="text-xs text-muted-foreground">
                      Unique artists this week
                    </p>
                    <Progress value={65} className="mt-3" />
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                  <CardHeader>
                    <CardTitle>Listening Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                      <BarChart className="h-16 w-16" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="col-span-3">
                  <CardHeader>
                    <CardTitle>Now Playing</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-md bg-muted flex items-center justify-center">
                        <Disc className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-medium leading-none">
                          Not Playing
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          No active scrobbles
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="recent">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Scrobbles</CardTitle>
                  <CardDescription>Your latest music activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="flex items-center gap-4 py-4">
                      <Avatar>
                        <AvatarFallback>
                          <Music2 className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          Track Name
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Artist Name
                        </p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Just now
                      </div>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}
