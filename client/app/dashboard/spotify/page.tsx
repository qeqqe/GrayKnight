"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SpotifyTokenManager } from "@/utils/spotify.utils";

interface spotifyData {
  display_name: string;
  country: string;
  email: string;
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

interface SpotifyArtist {
  external_urls: {
    spotify: string;
  };
  id: string;
  name: string;
  images: { url: string; height: number; width: number }[];
  genres: string[];
  followers: { href: string | null; total: number };
  href: string;
  popularity: number;
  type: string;
  uri: string;
}

interface FollowingData {
  artists: {
    href: string;
    limit: number;
    next: string | null;
    cursors: {
      after: string;
      before: string;
    };
    total: number;
    items: SpotifyArtist[];
  };
}

const SpotifyDashboard = () => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [spotifyData, setSpotifyData] = useState<spotifyData | null>(null);
  const [otherUserData, setOtherUserData] = useState<spotifyOtherData | null>(
    null
  );
  const [following, setFollowing] = useState<SpotifyArtist[]>([]);
  const [isFollowingModalOpen, setIsFollowingModalOpen] = useState(false);
  const [followingCount, setFollowingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Add this effect with higher priority (before other effects)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    console.log("Initial URL check:", {
      params: Object.fromEntries(params.entries()),
      isConnected: params.get("spotify_connected"),
    });

    // Immediately check for existing token
    const existingToken = localStorage.getItem("spotify_access_token");
    if (existingToken) {
      console.log("Existing token found");
      setIsConnected(true);
      return;
    }

    if (params.get("spotify_connected") === "true") {
      try {
        const accessToken = params.get("spotify_access_token");
        const refreshToken = params.get("spotify_refresh_token");
        const expiresIn = params.get("spotify_expires_in");

        console.log("Received new tokens:", {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          expiresIn: expiresIn,
        });

        if (!accessToken || !refreshToken || !expiresIn) {
          throw new Error("Missing tokens in OAuth response");
        }

        localStorage.setItem("spotify_access_token", accessToken);
        localStorage.setItem("spotify_refresh_token", refreshToken);
        localStorage.setItem(
          "spotify_token_expiry",
          (Date.now() + parseInt(expiresIn) * 1000).toString()
        );

        setIsConnected(true);
        // Remove query parameters
        window.history.replaceState({}, "", window.location.pathname);
      } catch (error) {
        console.error("OAuth handling failed:", error);
        SpotifyTokenManager.clearTokens();
        setIsConnected(false);
        setError("Failed to complete Spotify connection");
      }
    }
  }, []); // This effect runs first

  // Modify the connection check effect
  useEffect(() => {
    if (!isConnected) return;

    let isMounted = true;
    const checkConnection = async () => {
      try {
        const token = await SpotifyTokenManager.getValidToken();
        if (!token) {
          if (isMounted) {
            console.log("No valid token available");
            setIsConnected(false);
            return;
          }
        }

        // Validate token explicitly if we need to fetch data
        if (!spotifyData && isMounted) {
          let isValid = false;
          if (token) {
            isValid = await SpotifyTokenManager.validateToken(token);
            if (!isValid) {
              console.log("Token validation failed");
              setIsConnected(false);
              SpotifyTokenManager.clearTokens();
              return;
            }
          }
          if (!isValid) {
            console.log("Token validation failed");
            setIsConnected(false);
            SpotifyTokenManager.clearTokens();
            return;
          }

          const data = await SpotifyTokenManager.fetchWithToken(
            "https://api.spotify.com/v1/me"
          );

          if (data && isMounted) {
            setSpotifyData({
              display_name: data.display_name,
              country: data.country,
              email: data.email,
            });
            setOtherUserData({
              followers: data.followers,
              images: data.images || [],
            });
          }
        }
      } catch (error) {
        console.error("Connection check failed:", error);
        if (isMounted) {
          setIsConnected(false);
          SpotifyTokenManager.clearTokens();
        }
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 60000); // Check every minute
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isConnected, spotifyData]);

  // Remove or modify other useEffects that might interfere
  // Keep only the following data effect
  useEffect(() => {
    if (!isConnected) return;
    // ...existing following data fetch logic...
    const getFollowingData = async () => {
      if (!isConnected) return;
      setIsLoading(true);

      try {
        const data = await SpotifyTokenManager.fetchWithToken(
          "https://api.spotify.com/v1/me/following?type=artist&limit=20"
        );

        if (data?.artists?.items) {
          setFollowing(data.artists.items);
          setFollowingCount(data.artists.total);
        }
      } catch (error) {
        console.error("Failed to fetch following data:", error);
        setError("Failed to load following artists");
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    if (isConnected) {
      getFollowingData();
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

  return (
    <>
      {!isConnected ? (
        <Card className="border-dashed">
          <CardHeader className="text-center">
            <CardTitle>Connect Your Spotify Account</CardTitle>
            <CardDescription>
              Connect your Spotify account to access your playlists and more
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-6">
            <Button size="lg" className="gap-2" onClick={handleSpotifyConnect}>
              Connect with Spotify
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="border max-w-[400px] p-6">
            <CardHeader className="flex flex-row items-center gap-4">
              <Avatar className="h-24 w-24">
                <AvatarImage
                  src={otherUserData?.images?.[0]?.url || "/default-avatar.png"}
                  alt="Spotify Avatar"
                  className="h-full w-full object-cover"
                />
                <AvatarFallback>
                  {spotifyData?.display_name
                    ? spotifyData.display_name[0]
                    : "S"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <CardTitle>{spotifyData?.display_name}</CardTitle>
                <CardDescription>Spotify User</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {spotifyData && (
                <div className="grid gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Country:</span>
                    <span>{spotifyData.country}</span>
                  </div>
                  {/* <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Email:</span>
                    <span>{spotifyData.email}</span>
                  </div> */}
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Followers:</span>
                    <span>{otherUserData?.followers.total}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Following:</span>
                    <Button
                      variant="link"
                      className="p-0 h-auto"
                      onClick={() => setIsFollowingModalOpen(true)}
                    >
                      {followingCount} artists
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Dialog
            open={isFollowingModalOpen}
            onOpenChange={setIsFollowingModalOpen}
          >
            <DialogContent className="max-w-2xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle>Following Artists ({followingCount})</DialogTitle>
              </DialogHeader>
              <ScrollArea className="h-[60vh] pr-4">
                {isLoading ? (
                  <div className="flex justify-center p-4">Loading...</div>
                ) : following.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4 p-4">
                    {following.map((artist) => (
                      <div
                        key={artist.id}
                        className="flex items-center gap-3 p-3 rounded-lg border"
                      >
                        <Avatar className="h-12 w-12">
                          <AvatarImage
                            src={artist.images?.[0]?.url}
                            alt={artist.name}
                          />
                          <AvatarFallback>{artist.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium">{artist.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {artist.followers.total.toLocaleString()} followers
                          </span>
                          {artist.genres.length > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {artist.genres.slice(0, 2).join(", ")}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex justify-center p-4">
                    No artists found
                  </div>
                )}
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </>
      )}
    </>
  );
};

export default SpotifyDashboard;
