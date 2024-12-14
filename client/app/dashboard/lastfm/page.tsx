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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

interface Track {
  name: string;
  artist: {
    "#text": string;
    name?: string;
  };
  image: Array<{
    "#text": string;
    size: string;
  }>;
}

interface LastFmProfile {
  name: string;
  playcount: string;
  image: Array<{
    "#text": string;
    size: string;
  }>;
}

interface MusicProfile {
  lastfm: LastFmProfile;
  recentTracks: {
    track: Track[];
  };
}
interface Artist {
  name: string;
  playcount: string;
  listeners?: string;
  mbid: string;
  url: string;
  streamable: string;
  image: Array<{
    "#text": string;
    size: "small" | "medium" | "large" | "extralarge" | "mega";
  }>;
  "@attr"?: {
    rank: string;
  };
}

interface UserTopTrack {
  name: string;
  duration: string;
  playcount: string;
  artist: {
    name: string;
    "#text"?: string;
  };
  image: Array<{
    "#text": string;
    size: string;
  }>;
}

interface RecentTrack {
  name: string;
  artist: {
    "#text": string;
    name?: string;
  };
  album: {
    "#text": string;
  };
  image: Array<{
    "#text": string;
    size: string;
  }>;
  "@attr"?: {
    nowplaying: boolean;
  };
  date?: {
    uts: string;
  };
}

interface CurrentTrack {
  playing: boolean;
  track: {
    name: string;
    artist: string;
    album: string;
    image?: string;
    userPlaycount?: number;
    tags?: Array<{ name: string }>;
  };
  timestamp?: number;
}

// Add new interface for recent tracks response
interface RecentTracksResponse {
  tracks: RecentTrack[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
    user: string;
  };
}

const LastFmDashboard = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [lastfmUser, setLastfmUser] = useState<any>(null);
  const { logout } = useAuth();
  const [topArtists, setTopArtists] = useState<Artist[]>([]);
  const [currentTrack, setCurrentTrack] = useState<CurrentTrack | null>(null);
  const [recentTracks, setRecentTracks] = useState<RecentTrack[]>([]);
  const [userTopArtists, setUserTopArtists] = useState<any[]>([]);
  const [userTopTracks, setUserTopTracks] = useState<UserTopTrack[]>([]);
  const [tracksPeriod, setTracksPeriod] = useState<string>("7day");
  const [artistsPeriod, setArtistsPeriod] = useState<string>("7day");
  const [musicProfile, setMusicProfile] = useState<MusicProfile | null>(null);

  const handleLastFmConnect = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No auth token found");
      return;
    }

    const encodedToken = encodeURIComponent(token);
    window.location.href = `http://localhost:3001/auth/lastfm?auth_token=${encodedToken}`;
  };

  const makeAuthenticatedRequest = async (
    url: string,
    options: RequestInit = {}
  ) => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No authentication token found");

    const headers = new Headers(options.headers || {});
    headers.set("Authorization", `Bearer ${token}`);

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Request failed");
    }

    return response.json();
  };

  useEffect(() => {
    const init = async () => {
      try {
        // Get the token from localStorage
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No auth token found");
          return;
        }

        const response = await fetch(
          "http://localhost:3001/api/lastfm/status",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();
        console.log("Last.fm status:", data);

        if (data.connected && data.userInfo) {
          setIsConnected(true);
          setLastfmUser(data.userInfo);
          // Store the Last.fm session key if it's in URL params
          const urlParams = new URLSearchParams(window.location.search);
          const sessionKey = urlParams.get("sessionKey");
          if (sessionKey) {
            localStorage.setItem("lastfm_session_key", sessionKey);
          }
        }
      } catch (error) {
        console.error("Failed to check Last.fm status:", error);
      }
    };

    init();

    // Check URL parameters for Last.fm connection success
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("lastfm_connected") === "true") {
      const sessionKey = urlParams.get("sessionKey");
      const username = urlParams.get("username");
      if (sessionKey && username) {
        localStorage.setItem("lastfm_session_key", sessionKey);
        setIsConnected(true);
      }
    }
  }, []);

  useEffect(() => {
    fetch("http://localhost:3001/api/lastfm/topartists")
      .then((res) => res.json())
      .then((artists) => {
        console.log("🎸 First artist data:", artists[0]);
        console.log("🎸 First artist image data:", artists[0]?.image);
        setTopArtists(artists);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!isConnected) return;

    const fetchCurrentTrack = async () => {
      console.log("🎵 Starting fetchCurrentTrack");
      try {
        const token = localStorage.getItem("token");
        const sessionKey = localStorage.getItem("lastfm_session_key");

        if (!token || !sessionKey) {
          console.log("🎵 Missing credentials", {
            hasToken: !!token,
            hasSession: !!sessionKey,
          });
          return;
        }

        const response = await fetch(
          "http://localhost:3001/api/lastfm/now-playing",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "x-lastfm-session": sessionKey,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("🎵 Response data:", data);
        setCurrentTrack(data);
      } catch (error) {
        console.error("🎵 Failed to fetch current track:", error);
      }
    };

    fetchCurrentTrack();
    const interval = setInterval(fetchCurrentTrack, 15000);
    return () => clearInterval(interval);
  }, [isConnected]);

  useEffect(() => {
    if (!isConnected) return;

    const fetchRecentTracks = async (page = 1, limit = 50) => {
      try {
        const token = localStorage.getItem("token");
        const sessionKey = localStorage.getItem("lastfm_session_key");

        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          extended: "1",
        });

        const response = await fetch(
          `http://localhost:3001/api/lastfm/user/recent?${params}`,
          {
            headers: new Headers({
              Authorization: `Bearer ${token}`,
              "x-lastfm-session": sessionKey || "",
            }),
          }
        );

        const data: RecentTracksResponse = await response.json();
        console.log("Recent tracks response:", data);

        if (data?.tracks) {
          setRecentTracks(data.tracks);
        }
      } catch (error) {
        console.error("Failed to fetch recent tracks:", error);
      }
    };

    fetchRecentTracks();
    const interval = setInterval(fetchRecentTracks, 30000);
    return () => clearInterval(interval);
  }, [isConnected]);

  useEffect(() => {
    if (!isConnected) return;

    const fetchUserTopArtists = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `http://localhost:3001/api/lastfm/user/top-artists?period=${artistsPeriod}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await response.json();
        setUserTopArtists(data.artist || []);
      } catch (error) {
        console.error("Failed to fetch top artists:", error);
      }
    };

    fetchUserTopArtists();
  }, [isConnected, artistsPeriod]); // Add artistsPeriod as dependency

  useEffect(() => {
    if (!isConnected) return;

    const fetchUserTopTracks = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `http://localhost:3001/api/lastfm/user/top-tracks?period=${tracksPeriod}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await response.json();
        setUserTopTracks(data.track || []);
      } catch (error) {
        console.error("Failed to fetch top tracks:", error);
      }
    };

    fetchUserTopTracks();
  }, [isConnected, tracksPeriod]);

  useEffect(() => {
    const fetchMusicProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          "http://localhost:3001/api/music-profile",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await response.json();
        setMusicProfile(data);
      } catch (error) {
        console.error("Failed to fetch music profile:", error);
      }
    };

    if (isConnected) {
      fetchMusicProfile();
      const interval = setInterval(fetchMusicProfile, 60000);
      return () => clearInterval(interval);
    }
  }, [isConnected]);

  const connectLastFm = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:3001/auth/lastfm/connect",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const { authUrl } = await response.json();
      window.location.href = authUrl;
    } catch (error) {
      console.error("Failed to connect Last.fm:", error);
    }
  };

  const renderContent = () => {
    // Check both isConnected and session key
    const sessionKey = localStorage.getItem("lastfm_session_key");
    if (!isConnected || !sessionKey) {
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
              {lastfmUser?.image?.[3]?.["#text"] && (
                <img
                  src={lastfmUser.image[3]["#text"]}
                  alt="Profile"
                  className="object-cover"
                />
              )}
              <AvatarFallback>
                {lastfmUser?.name?.[0]?.toUpperCase()}
              </AvatarFallback>
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

    const formatNumber = (num: number) => {
      if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
      if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
      return num.toString();
    };

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
          {currentTrack?.track ? (
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="h-24 w-24 rounded-md bg-muted overflow-hidden">
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
                <div className="flex-1 space-y-1">
                  <h3 className="font-medium text-lg leading-none">
                    {currentTrack.track.name}
                  </h3>
                  <p className="text-base text-muted-foreground">
                    {currentTrack.track.artist}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {currentTrack.track.album}
                  </p>
                  {currentTrack.track.userPlaycount && (
                    <p className="text-sm">
                      Played {formatNumber(currentTrack.track.userPlaycount)}{" "}
                      times
                    </p>
                  )}
                </div>
              </div>

              {currentTrack.track.tags &&
                currentTrack.track.tags.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {currentTrack.track.tags
                      .slice(0, 5)
                      .map((tag: { name: string }) => (
                        <span
                          key={tag.name}
                          className="px-2 py-1 text-xs rounded-full bg-muted"
                        >
                          {tag.name}
                        </span>
                      ))}
                  </div>
                )}

              {!currentTrack.playing && currentTrack.timestamp && (
                <p className="text-sm text-muted-foreground">
                  {elapsed < 60
                    ? `${elapsed}s ago`
                    : elapsed < 3600
                    ? `${Math.floor(elapsed / 60)}m ago`
                    : `${Math.floor(elapsed / 3600)}h ago`}
                </p>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="h-24 w-24 rounded-md bg-muted flex items-center justify-center">
                <Disc className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h4 className="font-medium leading-none">Nothing playing</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  No recent scrobbles
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const tracksContent = (
    <TabsContent value="tracks">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Top Tracks</CardTitle>
              <CardDescription>Your most played tracks</CardDescription>
            </div>
            <select
              value={tracksPeriod}
              onChange={(e) => setTracksPeriod(e.target.value)}
              className="p-2 rounded-md border bg-background"
            >
              <option value="7day">Last 7 Days</option>
              <option value="1month">Last Month</option>
              <option value="3month">Last 3 Months</option>
              <option value="6month">Last 6 Months</option>
              <option value="12month">Last Year</option>
              <option value="overall">All Time</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            {userTopTracks.map((track: UserTopTrack, index: number) => (
              <div
                key={`${track.name}-${index}`}
                className="flex items-center gap-4 py-4 border-b"
              >
                <div className="text-2xl font-bold w-8">{index + 1}</div>
                <Avatar className="h-12 w-12">
                  <AvatarImage
                    src={
                      track.image?.find((img) => img.size === "large")?.[
                        "#text"
                      ]
                    }
                    alt="Album art"
                  />
                  <AvatarFallback>
                    <Music2 className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{track.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {track.artist.name}
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    {parseInt(track.playcount).toLocaleString()} plays
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {track.duration
                      ? `${Math.floor(Number(track.duration) / 60)}:${(
                          Number(track.duration) % 60
                        )
                          .toString()
                          .padStart(2, "0")}`
                      : "N/A"}
                  </div>
                </div>
              </div>
            ))}
          </ScrollArea>
        </CardContent>
      </Card>
    </TabsContent>
  );

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  const recentTracksContent = (
    <TabsContent value="recent">
      <Card>
        <CardHeader>
          <CardTitle>Recent Scrobbles</CardTitle>
          <CardDescription>Your latest music activity</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            {recentTracks.map((track: RecentTrack, index: number) => (
              <div
                key={`${track.name}-${index}`}
                className="flex items-center gap-4 py-4 border-b"
              >
                <Avatar className="h-12 w-12">
                  {track.image?.[2]?.["#text"] && (
                    <img
                      src={track.image[2]["#text"]}
                      alt="Album art"
                      className="object-cover"
                    />
                  )}
                  <AvatarFallback>
                    <Music2 className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{track.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {track.artist?.name || track.artist?.["#text"]}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {track.album?.["#text"]}
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">
                  {track["@attr"]?.nowplaying ? (
                    <span className="flex items-center gap-2">
                      Now Playing
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    </span>
                  ) : track.date?.uts ? (
                    formatTimestamp(parseInt(track.date.uts))
                  ) : (
                    "N/A"
                  )}
                </div>
              </div>
            ))}
          </ScrollArea>
        </CardContent>
      </Card>
    </TabsContent>
  );

  return (
    <div className="space-y-8">
      {renderContent()}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
          <TabsTrigger value="artists">Top Artists</TabsTrigger>
          <TabsTrigger value="tracks">Top Tracks</TabsTrigger>
          <TabsTrigger value="music">Music Profile</TabsTrigger>
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

        {recentTracksContent}

        <TabsContent value="artists">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Top Artists</CardTitle>
                  <CardDescription>Your top artists on Last.fm</CardDescription>
                </div>
                <select
                  value={artistsPeriod}
                  onChange={(e) => setArtistsPeriod(e.target.value)}
                  className="p-2 rounded-md border bg-background"
                >
                  <option value="7day">Last 7 Days</option>
                  <option value="1month">Last Month</option>
                  <option value="3month">Last 3 Months</option>
                  <option value="6month">Last 6 Months</option>
                  <option value="12month">Last Year</option>
                  <option value="overall">All Time</option>
                </select>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                {userTopArtists.map((artist: Artist, index: number) => (
                  <div
                    key={artist.name}
                    className="flex items-center gap-4 py-4 border-b"
                  >
                    <div className="text-2xl font-bold w-8">{index + 1}</div>
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={
                          artist.image?.find(
                            (img) =>
                              img.size === "large" || img.size === "extralarge"
                          )?.["#text"]
                        }
                        alt={artist.name}
                      />
                      <AvatarFallback>{artist.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{artist.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {parseInt(artist.playcount).toLocaleString()} plays
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {parseInt(artist.listeners || "0").toLocaleString()}{" "}
                      listeners
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {tracksContent}

        <TabsContent value="music">
          <Card>
            <CardHeader>
              <CardTitle>Music Profile</CardTitle>
              <CardDescription>Your Last.fm listening stats</CardDescription>
            </CardHeader>
            <CardContent>
              {musicProfile ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage
                        src={musicProfile.lastfm.image[2]?.["#text"]}
                      />
                      <AvatarFallback>LF</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">
                        {musicProfile.lastfm.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {parseInt(
                          musicProfile.lastfm.playcount
                        ).toLocaleString()}{" "}
                        scrobbles
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Recent Tracks</h4>
                    {musicProfile.recentTracks.track.map((track, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-sm"
                      >
                        <img
                          src={track.image[0]?.["#text"]}
                          alt=""
                          className="w-8 h-8"
                        />
                        <div>
                          <p>{track.name}</p>
                          <p className="text-muted-foreground">
                            {track.artist["#text"]}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <Button onClick={connectLastFm}>Connect Last.fm</Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LastFmDashboard;
