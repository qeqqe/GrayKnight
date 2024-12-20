"use client";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { formatDistance, format } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Clock,
  PlayCircle,
  ListMusic,
  Radio,
  UserPlus,
  Heart,
  AudioLines,
  SquareLibrary,
} from "lucide-react";
import { Search as SearchIcon } from "lucide-react";

import type {
  spotifyTrack,
  spotifyData,
  spotifyOtherData,
  SpotifyPlaylist,
  SpotifyPlaylistItem,
  SpotifyQueue,
  RecentlyPlayedItem,
} from "./types";

import {
  CurrentlyPlaying,
  PlaylistSection,
  RecentlyPlayed,
  QueueSection,
  PlaylistDialog,
  DevicesSection,
  Search,
} from "./_components";
import FollowedArtists from "./_components/FollowedArtists";
import SavedTrack from "./_components/SavedTrack";
import TopItems from "./_components/TopItems";
import MoreData from "./_components/MoreData";

interface TrackProgress {
  timestamp: number;
  progress: number;
  completed: boolean; // Track whether this play has been counted
}

const SpotifyDashboard = () => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [spotifyData, setSpotifyData] = useState<spotifyData | null>(null);
  const [otherUserData, setOtherUserData] = useState<spotifyOtherData | null>(
    null
  );
  const [currentTrack, setCurrentTrack] = useState<spotifyTrack | null>(null);
  const [playlists, setPlaylists] = useState<SpotifyPlaylistItem[]>([]);
  const [playlistsLoading, setPlaylistsLoading] = useState(false);
  const [openPlaylistId, setOpenPlaylistId] = useState<string | null>(null);
  const [queue, setQueue] = useState<spotifyTrack[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<RecentlyPlayedItem[]>(
    []
  );
  const [showFollowingDialog, setShowFollowingDialog] = useState(false);
  const [totalFollowing, setTotalFollowing] = useState(0);
  const [lastSavedTrack, setLastSavedTrack] = useState<{
    id: string;
    timestamp: number;
  } | null>(null);

  const [trackProgress, setTrackProgress] = useState<
    Map<string, TrackProgress>
  >(new Map());
  const MIN_SCROBBLE_TIME = 240000; // 4 minutes
  const SAME_TRACK_THRESHOLD = 1800000; // 30 minutes

  const refreshSpotifyToken = async () => {
    try {
      console.log("Starting Spotify token refresh...");
      const refreshToken = localStorage.getItem("spotify_refresh_token");

      if (!refreshToken) {
        throw new Error("No refresh token found");
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      console.log("Making refresh request to:", `${apiUrl}/auth/refresh`);

      const response = await fetch(`${apiUrl}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refresh_token: refreshToken,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Token refresh failed: ${response.status} ${JSON.stringify(
            errorData
          )}`
        );
      }

      const data = await response.json();
      console.log("Token refresh successful:", {
        hasAccessToken: !!data.access_token,
        hasRefreshToken: !!data.refresh_token,
        expiresIn: data.expires_in,
      });

      // Update stored tokens
      localStorage.setItem("spotify_access_token", data.access_token);
      localStorage.setItem(
        "spotify_token_expiry",
        (Date.now() + (data.expires_in || 3600) * 1000).toString()
      );

      if (data.refresh_token) {
        localStorage.setItem("spotify_refresh_token", data.refresh_token);
      }

      return true;
    } catch (error) {
      console.error("Token refresh failed:", error);
      // Only clear tokens on specific errors
      if (
        error instanceof Error &&
        (error.message.includes("invalid_grant") ||
          error.message.includes("Invalid refresh token"))
      ) {
        localStorage.removeItem("spotify_access_token");
        localStorage.removeItem("spotify_refresh_token");
        localStorage.removeItem("spotify_token_expiry");
        localStorage.removeItem("spotify_connected");
        setIsConnected(false);
        setSpotifyData(null);
        setOtherUserData(null);
        setCurrentTrack(null);
      }
      return false;
    }
  };

  const checkTokenExpiration = async () => {
    try {
      const expiryTime = localStorage.getItem("spotify_token_expiry");
      const accessToken = localStorage.getItem("spotify_access_token");

      if (!expiryTime || !accessToken) {
        throw new Error("Missing token data");
      }

      // eefresh token 5m before exp
      const hasExpired = Date.now() > parseInt(expiryTime) - 300000;

      if (hasExpired) {
        console.log("Token expired or expiring soon, attempting refresh...");
        const refreshSuccess = await refreshSpotifyToken();
        if (!refreshSuccess) {
          throw new Error("Token refresh failed");
        }
        console.log("Token refresh successful");
      }
      return true;
    } catch (error) {
      console.error("Token validation failed:", error);
      setIsConnected(false);
      return false;
    }
  };

  useEffect(() => {
    const validateConnection = async () => {
      const spotifyConnected =
        localStorage.getItem("spotify_connected") === "true";
      if (spotifyConnected) {
        const isValid = await checkTokenExpiration();
        setIsConnected(isValid);
      } else {
        setIsConnected(false);
      }
    };

    validateConnection();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);

    if (params.get("error")) {
      setError(params.get("error"));
      setIsConnected(false);
      localStorage.setItem("spotify_connected", "false");
      return;
    }

    if (params.get("spotify_connected") === "true") {
      try {
        localStorage.setItem(
          "spotify_access_token",
          params.get("spotify_access_token") || ""
        );
        localStorage.setItem(
          "spotify_refresh_token",
          params.get("spotify_refresh_token") || ""
        );
        localStorage.setItem(
          "spotify_token_expiry",
          (
            Date.now() +
            parseInt(params.get("spotify_expires_in") || "0") * 1000
          ).toString()
        );
        localStorage.setItem("spotify_connected", "true");
        setIsConnected(true);
        router.replace("/dashboard");
        localStorage.setItem("onPage", "spotify");
      } catch (error) {
        console.error("Failed to store Spotify tokens:", error);
        setError("Failed to complete Spotify connection");
        setIsConnected(false);
        localStorage.setItem("spotify_connected", "false");
      }
    }
  }, [router]);

  const SendTrackData = async (track: spotifyTrack) => {
    const spotify_user_id = localStorage.getItem("spotify_user_id");
    const token = localStorage.getItem("token");
    const response = await fetch(
      `${process.env.BACKEND_URL || "http://localhost:3000"}/api/spotify/track`
    );
  };

  useEffect(() => {
    const fetchCurrentTrack = async () => {
      if (!checkTokenExpiration()) {
        return;
      }

      const token = localStorage.getItem("spotify_access_token");
      try {
        const response = await fetch(
          "https://api.spotify.com/v1/me/player/currently-playing",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log("Response status:", response.status);

        if (response.status === 204) {
          setCurrentTrack(null);
          return;
        }

        const data = await response.json();

        if (data.item) {
          const trackData: spotifyTrack = {
            id: data.item.id,
            name: data.item.name,
            duration_ms: data.item.duration_ms,
            explicit: data.item.explicit,
            artists: data.item.artists,
            album: data.item.album,
            preview_url: data.item.preview_url,
            popularity: data.item.popularity || 0,
            progress_ms: data.progress_ms || 0,
            is_playing: data.is_playing,
            uri: data.item.uri,
            external_urls: data.item.external_urls,
          };
          setCurrentTrack(trackData);

          const currentTime = Date.now();
          const lastProgress = trackProgress.get(trackData.id);
          const halfDuration = trackData.duration_ms / 2;
          const minRequiredProgress = Math.min(halfDuration, MIN_SCROBBLE_TIME);

          const shouldScrobble = () => {
            // If no previous progress exists
            if (!lastProgress) {
              return trackData.progress_ms >= minRequiredProgress;
            }

            // If this is a new session (30+ minutes since last play)
            if (currentTime - lastProgress.timestamp > SAME_TRACK_THRESHOLD) {
              return trackData.progress_ms >= minRequiredProgress;
            }

            // If track was completed and started over
            if (
              lastProgress.completed &&
              trackData.progress_ms < lastProgress.progress
            ) {
              return trackData.progress_ms >= minRequiredProgress;
            }

            // If track hasn't been marked as completed yet but has reached threshold
            if (
              !lastProgress.completed &&
              trackData.progress_ms >= minRequiredProgress
            ) {
              return true;
            }

            return false;
          };

          if (shouldScrobble()) {
            try {
              const user_token = localStorage.getItem("token");
              console.log("🎵 Attempting to scrobble track:", {
                name: trackData.name,
                progress: trackData.progress_ms,
                duration: trackData.duration_ms,
                lastProgress: lastProgress
                  ? {
                      progress: lastProgress.progress,
                      completed: lastProgress.completed,
                      timeSince: currentTime - lastProgress.timestamp,
                    }
                  : "none",
              });

              const response = await fetch(
                `${
                  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
                }/api/save-track`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${user_token}`,
                  },
                  body: JSON.stringify({
                    track: trackData,
                    timestamp: currentTime,
                    progress: trackData.progress_ms,
                    isNewSession:
                      !lastProgress ||
                      currentTime - lastProgress.timestamp >
                        SAME_TRACK_THRESHOLD,
                  }),
                }
              );

              if (response.ok) {
                setTrackProgress((prev) =>
                  new Map(prev).set(trackData.id, {
                    timestamp: currentTime,
                    progress: trackData.progress_ms,
                    completed: true,
                  })
                );
              }
            } catch (error) {
              console.error("Failed to scrobble track:", error);
            }
          } else {
            // Update progress without marking as completed
            setTrackProgress((prev) => {
              const current = prev.get(trackData.id);
              if (!current || trackData.progress_ms > current.progress) {
                return new Map(prev).set(trackData.id, {
                  timestamp: currentTime,
                  progress: trackData.progress_ms,
                  completed: current?.completed || false,
                });
              }
              return prev;
            });

            console.log("🎵 Updating progress without scrobble:", {
              name: trackData.name,
              progress: trackData.progress_ms,
              required: minRequiredProgress,
              lastProgress: lastProgress
                ? {
                    progress: lastProgress.progress,
                    completed: lastProgress.completed,
                    timeSince: currentTime - lastProgress.timestamp,
                  }
                : "none",
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch current track:", error);
      }
    };

    if (isConnected) {
      fetchCurrentTrack();
    }

    const interval = setInterval(() => {
      if (isConnected) {
        fetchCurrentTrack();
      }
    }, 10 * 1000);

    return () => clearInterval(interval);
  }, [isConnected, lastSavedTrack]);

  useEffect(() => {
    if (!currentTrack?.is_playing) return;

    const progressInterval = setInterval(() => {
      setCurrentTrack((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          progress_ms: Math.min(prev.progress_ms + 1000, prev.duration_ms),
        };
      });
    }, 1000);

    return () => clearInterval(progressInterval);
  }, [currentTrack?.is_playing]);

  useEffect(() => {
    const getSpotifyUserData = async () => {
      if (!checkTokenExpiration()) {
        return;
      }

      const token = localStorage.getItem("spotify_access_token");
      const response = await fetch("https://api.spotify.com/v1/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      console.log("Spotify user data:", data);

      localStorage.setItem("spotify_user_id", data.id);

      setSpotifyData({
        display_name: data.display_name,
        country: data.country,
        email: data.email,
        id: data.id,
        uri: data.uri,
      });

      setOtherUserData({
        followers: data.followers,
        images: data.images || [],
      });
    };

    if (isConnected) {
      getSpotifyUserData();
    }
  }, [isConnected]);

  const handleSpotifyConnect = () => {
    const token =
      typeof window !== "undefined"
        ? window.localStorage.getItem("token")
        : null;

    const scopes = [
      "user-read-currently-playing",
      "user-read-playback-state",
      "user-read-recently-played",
      "user-read-playback-position",
      "playlist-read-private",
      "user-modify-playback-state",
      "playlist-read-collaborative",
      "playlist-modify-public",
      "playlist-modify-private",
      "user-library-read",
      "user-library-modify",
      "user-top-read",
      "user-read-private",
      "user-read-email",
      "user-follow-read",
      "user-follow-modify",
      "streaming",
      "app-remote-control",
    ].join(" ");

    window.location.href = `${
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
    }/auth/spotify?token=${token}&scope=${encodeURIComponent(scopes)}`;
  };

  useEffect(() => {
    const user_id = localStorage.getItem("spotify_user_id");
    if (!user_id) return;
    try {
      const fetchUserPlaylists = async () => {
        const response = await fetch(
          `https://api.spotify.com/v1/users/${user_id}/playlists`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem(
                "spotify_access_token"
              )}`,
            },
          }
        );
        const data = await response.json();
      };
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    }
  });

  useEffect(() => {
    const fetchPlaylists = async () => {
      if (!isConnected || !spotifyData?.id) return;

      setPlaylistsLoading(true);
      try {
        const token = localStorage.getItem("spotify_access_token");
        const response = await fetch(
          `https://api.spotify.com/v1/users/${spotifyData.id}/playlists?limit=50`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) throw new Error("Failed to fetch playlists");

        const data: SpotifyPlaylist = await response.json();
        // Filter out invalid playlists
        const validPlaylists = data.items.filter(
          (playlist) =>
            playlist &&
            playlist.id &&
            playlist.name &&
            playlist.images &&
            Array.isArray(playlist.images) &&
            playlist.tracks
        );
        setPlaylists(validPlaylists);
        console.log("Fetched playlists:", validPlaylists);
      } catch (error) {
        console.error("Failed to fetch playlists:", error);
        setPlaylists([]);
      } finally {
        setPlaylistsLoading(false);
      }
    };

    fetchPlaylists();
  }, [isConnected, spotifyData?.id]);

  const fetchQueue = async () => {
    if (!checkTokenExpiration()) return;

    try {
      const token = localStorage.getItem("spotify_access_token");
      const response = await fetch(
        "https://api.spotify.com/v1/me/player/queue",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data: SpotifyQueue = await response.json();
        setQueue(data.queue || []);
      }
    } catch (error) {
      console.error("Failed to fetch queue:", error);
    }
  };

  const fetchRecentTrack = async () => {
    if (!checkTokenExpiration()) {
      console.log("Token validation failed in fetchRecentTrack");
      return;
    }

    const accessToken = localStorage.getItem("spotify_access_token");

    try {
      console.log("Fetching recent tracks...");
      const response = await fetch(
        "https://api.spotify.com/v1/me/player/recently-played?limit=7",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Recent tracks data:", data);

      if (data && Array.isArray(data.items)) {
        setRecentlyPlayed(data.items);
      }
    } catch (error) {
      console.error("Error fetching recent tracks:", error);
    }
  };

  useEffect(() => {
    if (isConnected) {
      console.log(
        "Running recently played tracks effect, isConnected:",
        isConnected
      );
      fetchRecentTrack();
      const interval = setInterval(() => {
        console.log("Running periodic recent tracks update");
        fetchRecentTrack();
      }, 60000);
      return () => clearInterval(interval);
    } else {
      console.log("Not fetching recent tracks - not connected");
    }
  }, [isConnected]);

  useEffect(() => {
    if (isConnected) {
      const token = localStorage.getItem("spotify_access_token");
      if (token) {
        const [, payload] = token.split(".");
        if (payload) {
          try {
            const decodedPayload = JSON.parse(atob(payload));
            console.log("Token scopes:", decodedPayload.scope);
          } catch (e) {
            console.log("Could not decode token payload");
          }
        }
      }
    }
  }, [isConnected]);

  useEffect(() => {
    if (isConnected) {
      fetchQueue();
      const interval = setInterval(fetchQueue, 30 * 1000);
      return () => clearInterval(interval);
    }
  }, [isConnected]);

  const renderConnectCard = () => (
    <Card className="border-dashed">
      <CardHeader className="text-center">
        <CardTitle>Connect Your Spotify Account</CardTitle>
        <CardDescription>
          {error ? (
            <span className="text-red-400">{error}</span>
          ) : (
            "Connect your Spotify account to access your playlists and more"
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center pb-6">
        <Button size="lg" className="gap-2" onClick={handleSpotifyConnect}>
          {error ? "Reconnect Spotify" : "Connect with Spotify"}
        </Button>
      </CardContent>
    </Card>
  );

  const renderUserProfile = () => (
    <Card className="relative overflow-hidden border bg-gradient-to-br from-white to-zinc-100/50 dark:from-zinc-900 dark:to-zinc-800 p-4 sm:p-6 md:p-8 hover:shadow-xl transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 dark:from-green-500/10 dark:to-emerald-500/10 pointer-events-none" />
      <div className="flex flex-row items-center gap-6 md:gap-8 relative z-10">
        <Avatar className="h-24 w-24 md:h-32 md:w-32 ring-4 ring-green-500/20 hover:ring-green-500/40 transition-all duration-300 shadow-xl flex-shrink-0">
          <AvatarImage
            src={otherUserData?.images?.[0]?.url || "/default-avatar.png"}
            alt="Spotify Avatar"
            className="object-cover"
          />
          <AvatarFallback className="text-2xl md:text-4xl font-bold bg-gradient-to-br from-green-400 to-emerald-600">
            {spotifyData?.display_name ? spotifyData.display_name[0] : "S"}
          </AvatarFallback>
        </Avatar>
        {spotifyData && (
          <CardContent className="p-0 space-y-3 md:space-y-4">
            <h3 className="font-bold text-2xl md:text-4xl bg-gradient-to-r from-green-600 to-emerald-700 dark:from-green-400 dark:to-emerald-500 bg-clip-text text-transparent">
              {spotifyData.display_name}
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => setShowFollowingDialog(true)}
                className="text-zinc-600 dark:text-zinc-400 flex items-center gap-2 hover:text-green-500 transition-colors"
              >
                <span className="font-semibold text-lg md:text-xl text-zinc-900 dark:text-white">
                  {totalFollowing}
                </span>
                Following
              </button>
              <p className="text-zinc-600 dark:text-zinc-400">
                Location:{" "}
                <span className="text-zinc-900 dark:text-white">
                  {spotifyData.country}
                </span>
              </p>
            </div>
          </CardContent>
        )}
      </div>
      <Dialog open={showFollowingDialog} onOpenChange={setShowFollowingDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-green-500" />
              Following {totalFollowing.toLocaleString()} Artists
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh] mt-4">
            <FollowedArtists onTotalFollowingChange={setTotalFollowing} />
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </Card>
  );

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-8 space-y-8">
      {!isConnected ? (
        renderConnectCard()
      ) : (
        <>
          {renderUserProfile()}

          <Tabs defaultValue="overview" className="space-y-6 gap-4 rounded-xl">
            <TabsList
              className="w-full justify-start overflow-x-auto overflow-y-hidden scroll-smooth scrollbar-hide border-b rounded-xl px-[0.7rem] sm:pt-[1.5rem] sm:pb-[1.5rem] md:pb-[1.5rem] h-12"
              id="tablist"
            >
              <TabsTrigger value="overview">
                <PlayCircle className="w-4 h-4" />
                <span className="hidden sm:inline-block ml-2">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="playlists">
                <ListMusic className="w-4 h-4" />
                <span className="hidden sm:inline-block ml-2">Playlists</span>
              </TabsTrigger>
              <TabsTrigger value="recent">
                <Clock className="w-4 h-4" />
                <span className="hidden sm:inline-block ml-2">Recent</span>
              </TabsTrigger>
              <TabsTrigger value="devices">
                <Radio className="w-4 h-4" />
                <span className="hidden sm:inline-block ml-2">Devices</span>
              </TabsTrigger>
              <TabsTrigger value="search">
                <SearchIcon className="w-4 h-4" />
                <span className="hidden sm:inline-block ml-2">Search</span>
              </TabsTrigger>
              <TabsTrigger value="savedTrack">
                <Heart className="w-4 h-4" />
                <span className="hidden sm:inline-block ml-2">
                  Saved Tracks
                </span>
              </TabsTrigger>
              <TabsTrigger value="TopItems">
                <AudioLines className="w-4 h-4" />
                <span className="hidden sm:inline-block ml-2">Top Items</span>
              </TabsTrigger>
              <TabsTrigger value="MoreData">
                <SquareLibrary className="w-4 h-4" />
                <span className="hidden sm:inline-block ml-2">More Data</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6 h-[280px] flex flex-col">
                  <CardHeader className="px-0 pt-0">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <PlayCircle className="w-5 h-5" />
                      Now Playing
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-0 pb-0 flex-1">
                    <CurrentlyPlaying track={currentTrack} />
                  </CardContent>
                </Card>

                <Card className="p-6 h-[440px] flex flex-col">
                  <CardHeader className="px-0 pt-0 space-y-2">
                    <CardTitle className="text-xl font-semibold flex items-center gap-2">
                      <ListMusic className="w-5 h-5" />
                      Up Next
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-0 pb-0 flex-1">
                    <QueueSection queue={queue} />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="playlists" className="space-y-4">
              <PlaylistSection
                playlists={playlists}
                onSelect={setOpenPlaylistId}
              />
              {openPlaylistId && (
                <PlaylistDialog
                  playlist={playlists.find((p) => p.id === openPlaylistId)!}
                  isOpen={!!openPlaylistId}
                  onOpenChange={(open) =>
                    setOpenPlaylistId(open ? openPlaylistId : null)
                  }
                />
              )}
            </TabsContent>

            <TabsContent value="recent">
              <RecentlyPlayed items={recentlyPlayed} />
            </TabsContent>

            <TabsContent value="devices">
              <DevicesSection />
            </TabsContent>

            <TabsContent value="search">
              <Search />
            </TabsContent>
            <TabsContent value="savedTrack">
              <SavedTrack />
            </TabsContent>
            <TabsContent value="TopItems">
              <TopItems />
            </TabsContent>
            <TabsContent value="MoreData">
              <MoreData />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default SpotifyDashboard;
