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

// Add this interface with the other interfaces
interface PlaylistResponse {
  items: SpotifyPlaylistTrack[];
  next: string | null;
  total: number;
}

const TrackCard = ({ track }: { track: spotifyTrack }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const formattedDuration = `${Math.floor(track.duration_ms / 60000)}:${(
    (track.duration_ms % 60000) /
    1000
  )
    .toFixed(0)
    .padStart(2, "0")}`;

  const formattedProgress = `${Math.floor(track.progress_ms / 60000)}:${(
    (track.progress_ms % 60000) /
    1000
  )
    .toFixed(0)
    .padStart(2, "0")}`;

  const progressPercentage = (track.progress_ms / track.duration_ms) * 100;

  const formattedDate = track.album.release_date
    ? format(new Date(track.album.release_date), "dd/MM/yyyy")
    : "Release date unavailable";

  console.log("Track in card:", track);

  return (
    <>
      <Card
        onClick={() => setIsModalOpen(true)}
        className="mt-6 cursor-pointer group hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-zinc-900/50 to-zinc-800/50 border-zinc-700/50"
      >
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 group-hover:w-20 group-hover:h-20 transition-all duration-300">
              <img
                src={track.album.images[0]?.url}
                alt={track.album.name}
                className="w-full h-full object-cover rounded-md shadow-lg"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-all duration-300 rounded-md" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-white group-hover:text-green-400 transition-colors">
                {track.name}
              </h3>
              <p className="text-zinc-400 text-sm">
                {track.artists.map((artist) => artist.name).join(", ")}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-zinc-500">
                  {formattedProgress} / {formattedDuration}
                </span>
                {track.explicit && (
                  <span className="text-xs px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded">
                    Explicit
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-500 ease-linear"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Track Details
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-[200px,1fr] gap-6 mt-4">
            <div className="space-y-4">
              <img
                src={track.album.images[0]?.url}
                alt={track.album.name}
                className="w-full aspect-square object-cover rounded-lg shadow-xl"
              />
              <div className="space-y-1">
                <p className="text-sm font-medium text-zinc-400">Album</p>
                <p className="font-semibold">{track.album.name}</p>
                <p className="text-sm text-zinc-500">
                  Released: {formattedDate}
                </p>
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-green-400">
                  {track.name}
                </h3>
                <p className="text-lg text-zinc-400">
                  {track.artists.map((artist) => artist.name).join(", ")}
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-zinc-400">Duration:</span>
                  <span>{formattedDuration}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-zinc-400">Popularity:</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="w-full max-w-[200px] h-2 bg-zinc-800 rounded-full overflow-hidden cursor-help relative group">
                          <div
                            className="h-full bg-green-500"
                            style={{ width: `${track.popularity}%` }}
                          />
                          <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/90 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                            {track.popularity}/100
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-sm font-medium">
                          Popularity Score: {track.popularity}/100
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                {track.preview_url && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-zinc-400">Preview:</span>
                      <audio
                        controls
                        className="w-full h-8 [&::-webkit-media-controls-panel]:bg-zinc-800 [&::-webkit-media-controls-current-time-display]:text-white [&::-webkit-media-controls-time-remaining-display]:text-white"
                      >
                        <source src={track.preview_url} type="audio/mpeg" />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-4">
                <Button
                  onClick={() =>
                    window.open(track.album.external_urls.spotify, "_blank")
                  }
                  className="bg-green-500 hover:bg-green-600"
                >
                  Open in Spotify
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

const PlaylistDialog = ({
  playlist,
  isOpen,
  onOpenChange,
}: {
  playlist: SpotifyPlaylistItem;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const [tracks, setTracks] = useState<SpotifyPlaylistTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const loadingRef = useRef<HTMLDivElement>(null);

  const fetchTracks = async (url: string) => {
    try {
      const token = localStorage.getItem("spotify_access_token");
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch tracks");

      const data: PlaylistResponse = await response.json();
      setTracks((prev) => [...prev, ...data.items]);
      setNextUrl(data.next);
      setHasMore(!!data.next);
    } catch (error) {
      console.error("Failed to fetch playlist tracks:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && nextUrl) {
          setLoading(true);
          fetchTracks(nextUrl);
        }
      },
      { threshold: 0.5 }
    );

    if (loadingRef.current) {
      observer.observe(loadingRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, nextUrl]);

  useEffect(() => {
    if (!isOpen) {
      setTracks([]);
      setNextUrl(null);
      setHasMore(true);
      setLoading(true);
      return;
    }

    fetchTracks(`${playlist.tracks.href}?limit=50`);
  }, [playlist.tracks.href, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="bg-zinc-900 pb-4 border-b border-zinc-800 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src={playlist.images[0]?.url || "/placeholder.png"}
                alt={playlist.name}
                className="w-16 h-16 object-cover rounded-md"
              />
              <div>
                <DialogTitle className="text-2xl font-bold">
                  {playlist.name}
                </DialogTitle>
                <p className="text-sm text-zinc-400">
                  {playlist.tracks.total} tracks
                </p>
              </div>
            </div>
            <Button
              onClick={() =>
                window.open(playlist.external_urls.spotify, "_blank")
              }
              className="bg-green-500 hover:bg-green-600"
            >
              Open in Spotify
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto mt-4 spotify-scrollbar">
          <div className="space-y-2 px-6">
            {tracks.map((item, index) => (
              <div
                key={item.track.id + index}
                className="flex items-center gap-3 p-2 hover:bg-zinc-800/50 rounded-md group"
              >
                <img
                  src={item.track.album.images[2]?.url || "/placeholder.png"}
                  alt={item.track.album.name}
                  className="w-10 h-10 object-cover rounded"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">
                    {item.track.name}
                  </p>
                  <p className="text-sm text-zinc-400 truncate">
                    {item.track.artists.map((a) => a.name).join(", ")}
                  </p>
                </div>
                <div className="text-zinc-500 text-sm">
                  {Math.floor(item.track.duration_ms / 60000)}:
                  {((item.track.duration_ms % 60000) / 1000)
                    .toFixed(0)
                    .padStart(2, "0")}
                </div>
                {item.track.external_urls.spotify && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(item.track.external_urls.spotify, "_blank");
                    }}
                  >
                    Play
                  </Button>
                )}
              </div>
            ))}

            <div ref={loadingRef} className="py-4 flex justify-center">
              {loading && (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

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

    window.location.href = `${
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
    }/auth/spotify?token=${token}`;
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
        setPlaylists(data.items);
        console.log("Fetched playlists:", data);
      } catch (error) {
        console.error("Failed to fetch playlists:", error);
      } finally {
        setPlaylistsLoading(false);
      }
    };

    fetchPlaylists();
  }, [isConnected, spotifyData?.id]);

  return (
    <>
      <main className="space-y-6">
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
          <>
            <Card className="border bg-gradient-to-br from-zinc-900 to-zinc-800 p-4 sm:p-6 md:p-8 max-w-[28rem] ml-[5vh] hover:shadow-xl transition-all duration-300 relative overflow-hidden">
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

            {currentTrack && (
              <div className="max-w-[28rem] ml-[5vh]">
                <h2 className="text-xl font-semibold text-white mb-2">
                  Currently Playing
                </h2>
                <TrackCard track={currentTrack} />
              </div>
            )}

            {playlists.length > 0 && (
              <div className="max-w-[28rem] ml-[5vh]">
                <h2 className="text-xl font-semibold text-white mb-2">
                  Your Playlists
                </h2>
                <div className="space-y-2">
                  {playlists.map((playlist) => (
                    <div key={playlist.id}>
                      <Card
                        className="bg-zinc-900/50 hover:bg-zinc-900 transition-colors cursor-pointer"
                        onClick={() => setOpenPlaylistId(playlist.id)}
                      >
                        <CardContent className="flex items-center gap-3 p-3">
                          <img
                            src={playlist.images[0]?.url || "/placeholder.png"}
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
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
};

export default SpotifyDashboard;
