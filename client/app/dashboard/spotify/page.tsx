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

interface spotifyTrack {
  id: string;
  name: string;
  duration_ms: number;
  explicit: boolean;

  artists: {
    external_urls: {
      spotify: string;
    };
    href: string;
    id: string;
    name: string;
    type: string;
    uri: string;
  }[];

  album: {
    album_type: string;
    name: string;
    images: {
      url: string;
      height?: number;
      width?: number;
    }[];
    external_urls: {
      spotify: string;
    };
    release_date: string;
    release_date_precision: "year" | "month" | "day";
  };

  preview_url: string | null;
  popularity?: number;
  progress_ms: number;
  is_playing: boolean;
}

interface spotifyData {
  display_name: string;
  country: string;
  email: string;
  id: string;
  uri: string;
}

interface spotifyOtherData {
  followers: {
    total: number;
  };
  images: {
    url: string;
    height: number;
    width: number;
  }[];
}

interface SpotifyPlaylist {
  href: string;
  limit: number;
  next: string;
  offset: number;
  previous: string;
  total: number;
  items: SpotifyPlaylistItem[];
}

interface SpotifyPlaylistItem {
  collaborative: boolean;
  description: string;
  external_urls: {
    spotify: string;
  };
  href: string;
  id: string;
  images: SpotifyImage[];
  name: string;
  owner: {
    display_name: string;
    external_urls: {
      spotify: string;
    };
    href: string;
    id: string;
    type: string;
    uri: string;
  };
  primary_color: string | null;
  public: boolean;
  snapshot_id: string;
  tracks: {
    href: string;
    total: number;
  };
  type: string;
  uri: string;
}

interface SpotifyImage {
  height: number | null;
  url: string;
  width: number | null;
}

interface SpotifyPlaylistTrack {
  track: {
    id: string;
    name: string;
    duration_ms: number;
    explicit: boolean;
    artists: {
      name: string;
    }[];
    album: {
      name: string;
      images: SpotifyImage[];
    };
    external_urls: {
      spotify: string;
    };
  };
  added_at: string;
}

interface PlaylistResponse {
  items: SpotifyPlaylistTrack[];
  next: string | null;
  total: number;
}

interface SpotifyQueue {
  currently_playing: spotifyTrack | null;
  queue: spotifyTrack[];
}

interface RecentlyPlayedResponse {
  items: RecentlyPlayedItem[];
  next: string | null;
  cursors: {
    after: string;
    before: string;
  };
  limit: number;
}

interface SpotifyRecentlyPlayedResponse {
  items: RecentlyPlayedItem[];
  next: string | null;
  cursors: {
    after: string;
    before: string;
  };
  limit: number;
  href: string;
}

interface RecentlyPlayedItem {
  track: {
    album: {
      album_type: string;
      artists: Artist[];
      images: AlbumImage[];
      name: string;
      release_date: string;
      external_urls: {
        spotify: string;
      };
    };
    artists: Artist[];
    duration_ms: number;
    explicit: boolean;
    external_urls: {
      spotify: string;
    };
    id: string;
    name: string;
    popularity: number;
    preview_url: string | null;
  };
  played_at: string;
  context: {
    type: string;
    external_urls: {
      spotify: string;
    };
    uri: string;
  };
}

interface Artist {
  external_urls: {
    spotify: string;
  };
  name: string;
}

interface AlbumImage {
  height: number;
  url: string;
  width: number;
}

import {
  CurrentlyPlaying,
  PlaylistSection,
  RecentlyPlayed,
  QueueSection,
  TrackCard,
  PlaylistDialog,
  DevicesSection,
} from "./_components";

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

  const refreshSpotifyToken = async () => {
    try {
      const refreshToken = localStorage.getItem("spotify_refresh_token");
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/refresh_token?refresh_token=${refreshToken}`
      );

      if (!response.ok) {
        throw new Error(`Failed to refresh token: ${response.status}`);
      }

      const data = await response.json();
      console.log("Token refresh response:", data);

      if (!data.access_token) {
        throw new Error("No access token in response");
      }

      localStorage.setItem("spotify_access_token", data.access_token);
      localStorage.setItem(
        "spotify_token_expiry",
        (Date.now() + data.expires_in * 1000).toString()
      );

      return true;
    } catch (error) {
      console.error("Failed to refresh Spotify token:", error);
      localStorage.removeItem("spotify_access_token");
      localStorage.removeItem("spotify_refresh_token");
      localStorage.removeItem("spotify_token_expiry");
      localStorage.removeItem("spotify_connected");
      setIsConnected(false);
      setSpotifyData(null);
      setOtherUserData(null);
      setCurrentTrack(null);
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

      const hasExpired = Date.now() > parseInt(expiryTime) - 300000;

      if (hasExpired) {
        console.log("Token expired, attempting refresh...");
        const refreshSuccess = await refreshSpotifyToken();
        if (!refreshSuccess) {
          throw new Error("Token refresh failed");
        }
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
        // console.log("Raw Spotify data:", data);

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
          };

          // console.log("Processed track data:", trackData);
          setCurrentTrack(trackData);
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
  }, [isConnected]);

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
      "playlist-read-collaborative",
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

  return (
    <>
      <main className="space-y-6 p-4">
        {!isConnected ? (
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
              <Button
                size="lg"
                className="gap-2"
                onClick={handleSpotifyConnect}
              >
                {error ? "Reconnect Spotify" : "Connect with Spotify"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <Card className="border bg-gradient-to-br from-zinc-900 to-zinc-800 p-4 sm:p-6 md:p-8 hover:shadow-xl transition-all duration-300 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 pointer-events-none" />
                <div className="flex flex-row items-center gap-6 md:gap-8 relative z-10">
                  <Avatar className="h-24 w-24 md:h-32 md:w-32 ring-4 ring-green-500/20 hover:ring-green-500/40 transition-all duration-300 shadow-xl flex-shrink-0">
                    <AvatarImage
                      src={
                        otherUserData?.images?.[0]?.url || "/default-avatar.png"
                      }
                      alt="Spotify Avatar"
                      className="object-cover"
                    />
                    <AvatarFallback className="text-2xl md:text-4xl font-bold bg-gradient-to-br from-green-400 to-emerald-600">
                      {spotifyData?.display_name
                        ? spotifyData.display_name[0]
                        : "S"}
                    </AvatarFallback>
                  </Avatar>
                  {spotifyData && (
                    <CardContent className="p-0 space-y-3 md:space-y-4">
                      <h3 className="font-bold text-2xl md:text-4xl bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                        {spotifyData.display_name}
                      </h3>
                      <div className="space-y-2">
                        <p className="text-zinc-400 flex items-center gap-2">
                          <span className="font-semibold text-lg md:text-xl text-white">
                            {otherUserData?.followers?.total.toLocaleString()}
                          </span>
                          Followers
                        </p>
                        <p className="text-zinc-400">
                          Location:{" "}
                          <span className="text-white">
                            {spotifyData.country}
                          </span>
                        </p>
                      </div>
                    </CardContent>
                  )}
                </div>
              </Card>

              {playlists.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-white mb-2">
                    Your Playlists
                  </h2>
                  <ScrollArea className="h-[20rem] rounded-md">
                    <div className="space-y-2 pr-4">
                      {playlists.map((playlist) => (
                        <div key={playlist.id}>
                          <Card
                            className="bg-zinc-900/50 hover:bg-zinc-900 transition-colors cursor-pointer"
                            onClick={() => setOpenPlaylistId(playlist.id)}
                          >
                            <CardContent className="flex items-center gap-3 p-3">
                              <img
                                src={
                                  playlist.images[0]?.url || "/placeholder.png"
                                }
                                alt={playlist.name}
                                className="w-12 h-12 object-cover rounded"
                              />
                              <div>
                                <h3 className="font-medium text-white">
                                  {playlist.name}
                                </h3>
                                <p className="text-sm text-zinc-400">
                                  {playlist.tracks.total} tracks
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                          <PlaylistDialog
                            playlist={playlist}
                            isOpen={openPlaylistId === playlist.id}
                            onOpenChange={(open) =>
                              setOpenPlaylistId(open ? playlist.id : null)
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              <DevicesSection />
            </div>

            <div className="space-y-6">
              <CurrentlyPlaying track={currentTrack} />
              <RecentlyPlayed items={recentlyPlayed} />
              <QueueSection queue={queue} />
            </div>
          </div>
        )}
      </main>
    </>
  );
};

export default SpotifyDashboard;
