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
  const [lastfmUser, setLastfmUser] = useState<any>(null);
  const { logout } = useAuth();
  const [topArtists, setTopArtists] = useState<any[]>([]);
  const [currentTrack, setCurrentTrack] = useState<any>(null);

  const handleLastFmConnect = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No auth token found");
      return;
    }
    console.log("Starting Last.fm connection with token:", token);
    window.location.href = `http://localhost:3001/auth/lastfm?auth_token=${token}`;
  };

  useEffect(() => {
    const init = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.log("📍 No token found, skipping init");
          return;
        }

        console.log("📍 Stored Tokens:", {
          jwt: token,
          lastfm_session: localStorage.getItem("lastfm_session_key"),
          lastfm_username: localStorage.getItem("lastfm_username"),
        });

        const params = new URLSearchParams(window.location.search);
        console.log("📍 URL params:", Object.fromEntries(params.entries()));

        if (params.get("error")) {
          console.error("Auth error:", params.get("error"));
          return;
        }

        if (params.get("lastfm_connected") === "true") {
          const sessionKey = params.get("sessionKey");
          const username = params.get("username");
          console.log("Last.fm connection successful:", {
            sessionKey,
            username,
          });

          if (sessionKey && username) {
            localStorage.setItem("lastfm_session_key", sessionKey);
            localStorage.setItem("lastfm_username", username);
          }
        }

        console.log("📍 Checking Last.fm status...");
        const response = await fetch(
          "http://localhost:3001/api/lastfm/status",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await response.json();
        console.log("📍 Status response:", data);

        setIsConnected(data.connected);
        if (data.connected) {
          console.log("📍 Connected user data:", data.userInfo);
          setLastfmUser(data.userInfo);
          setDebugInfo(data);
        }
      } catch (error) {
        console.error("📍 Initialization error:", error);
      }
    };

    init();
  }, []);

  useEffect(() => {
    fetch("http://localhost:3001/api/lastfm/topartists")
      .then((res) => res.json())
      .then((data) => {
        console.log("Top artists data:", data);
        setTopArtists(data?.artist || []);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!isConnected) return;

    const fetchCurrentTrack = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await fetch(
          "http://localhost:3001/api/lastfm/now-playing",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();
        console.log("Current track data:", data);
        setCurrentTrack(data);
      } catch (error) {
        console.error("Failed to fetch current track:", error);
      }
    };

    fetchCurrentTrack();
    const interval = setInterval(fetchCurrentTrack, 30000);
    return () => clearInterval(interval);
  }, [isConnected]);

  useEffect(() => {
    return () => {
      // Don't remove the token on unmount if you want to persist the session
      // Only remove it on logout
      // localStorage.removeItem("lastfm_session_key");
      // localStorage.removeItem("lastfm_username");
    };
  }, []);

  const renderContent = () => {
    if (!isConnected) {
      return (
        <Card className="border-dashed">
          <CardHeader className="text-center">
            <CardTitle>Connect Your Last.fm Account</CardTitle>
            <CardDescription>
              Connect your Last.fm account to start tracking your music journey
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-6">
            <Button size="lg" className="gap-2" onClick={handleLastFmConnect}>
              <SiLastdotfm size={20} />
              Connect with Last.fm
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback>
                {lastfmUser?.name?.[0]?.toUpperCase()}
              </AvatarFallback>
              {lastfmUser?.image?.[3]?.["#text"] && (
                <img
                  src={lastfmUser.image[3]["#text"]}
                  alt="Profile"
                  className="object-cover"
                />
              )}
            </Avatar>
            <div>
              <CardTitle>{lastfmUser?.name}</CardTitle>
              <CardDescription>
                {parseInt(lastfmUser?.playcount).toLocaleString()} scrobbles
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {lastfmUser?.recentTrack && (
              <div className="flex items-center gap-2">
                <Music2 className="h-4 w-4" />
                <span>
                  {lastfmUser.recentTrack["@attr"]?.nowplaying
                    ? "Now playing: "
                    : "Last played: "}
                  <span className="font-medium">
                    {lastfmUser.recentTrack.name}
                  </span>
                  <span className="text-muted-foreground"> by </span>
                  <span className="font-medium">
                    {lastfmUser.recentTrack.artist["#text"]}
                  </span>
                </span>
              </div>
            )}
            <a
              href={lastfmUser?.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-500 hover:underline"
            >
              View Last.fm Profile
            </a>
          </div>
        </CardContent>
      </Card>
    );
  };

  const NowPlayingCard = () => {
    const [elapsed, setElapsed] = useState<number>(0);

    useEffect(() => {
      const timer = setInterval(() => {
        if (currentTrack?.timestamp) {
          setElapsed(Math.floor((Date.now() - currentTrack.timestamp) / 1000));
        }
      }, 1000);

      return () => clearInterval(timer);
    }, [currentTrack?.timestamp]);

    return (
      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>
            {currentTrack?.playing ? (
              <div className="flex items-center gap-2">
                Now Playing
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              </div>
            ) : (
              "Recently Played"
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {currentTrack?.track ? (
              <>
                <div className="h-16 w-16 rounded-md bg-muted overflow-hidden">
                  {currentTrack.track.image ? (
                    <img
                      src={currentTrack.track.image}
                      alt="Album art"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Disc className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="space-y-1 flex-1">
                  <h4 className="font-medium leading-none">
                    {currentTrack.track.name}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {currentTrack.track.artist}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {currentTrack.track.album}
                  </p>
                  {!currentTrack.playing && currentTrack.timestamp && (
                    <p className="text-xs text-muted-foreground">
                      {elapsed < 60
                        ? `${elapsed}s ago`
                        : elapsed < 3600
                        ? `${Math.floor(elapsed / 60)}m ago`
                        : `${Math.floor(elapsed / 3600)}h ago`}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="h-16 w-16 rounded-md bg-muted flex items-center justify-center">
                  <Disc className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-medium leading-none">Nothing playing</h4>
                  <p className="text-sm text-muted-foreground">
                    No recent scrobbles
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
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
        {renderContent()}
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

              <NowPlayingCard />
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

          <TabsContent value="artists">
            <Card>
              <CardHeader>
                <CardTitle>Top Artists</CardTitle>
                <CardDescription>Global top artists on Last.fm</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  {topArtists.map((artist: any, index: number) => (
                    <div
                      key={artist.name}
                      className="flex items-center gap-4 py-4 border-b"
                    >
                      <div className="text-2xl font-bold w-8">{index + 1}</div>
                      <Avatar className="h-12 w-12">
                        <AvatarFallback>{artist.name[0]}</AvatarFallback>
                        {artist.image?.[1]?.["#text"] && (
                          <img
                            src={artist.image[1]["#text"]}
                            alt={artist.name}
                            className="object-cover"
                          />
                        )}
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{artist.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {parseInt(artist.playcount).toLocaleString()} plays
                        </p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {parseInt(artist.listeners).toLocaleString()} listeners
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
function checkLastFmStatus() {
  throw new Error("Function not implemented.");
}
