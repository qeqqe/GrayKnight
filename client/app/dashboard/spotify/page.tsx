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

const SpotifyDashboard = () => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [spotifyData, setSpotifyData] = useState<spotifyData | null>(null);
  const [otherUserData, setOtherUserData] = useState<spotifyOtherData | null>(
    null
  );
  const [currentTrack, setCurrentTrack] = useState<spotifyTrack | null>(null);

  const refreshSpotifyToken = async () => {
    try {
      const refreshToken = localStorage.getItem("spotify_refresh_token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/refresh_token?refresh_token=${refreshToken}`
      );

      if (!response.ok) throw new Error("Failed to refresh token");

      const data = await response.json();

      localStorage.setItem("spotify_access_token", data.access_token);
      localStorage.setItem(
        "spotify_token_expiry",
        (Date.now() + data.expires_in * 1000).toString()
      );

      return true;
    } catch (error) {
      console.error("Failed to refresh Spotify token:", error);
      return false;
    }
  };

  const checkTokenExpiration = async () => {
    const expiryTime = localStorage.getItem("spotify_token_expiry");
    if (!expiryTime) return false;

    const hasExpired = Date.now() > parseInt(expiryTime) - 300000;

    if (hasExpired) {
      const refreshSuccess = await refreshSpotifyToken();
      if (!refreshSuccess) {
        localStorage.removeItem("spotify_access_token");
        localStorage.removeItem("spotify_refresh_token");
        localStorage.removeItem("spotify_token_expiry");
        setIsConnected(false);
        return false;
      }
      return true;
    }
    return true;
  };

  useEffect(() => {
    const spotifyConnected =
      localStorage.getItem("spotify_connected") === "true";
    setIsConnected(spotifyConnected);
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
        if (data.item) {
          const trackData: spotifyTrack = {
            id: data.item.id,
            name: data.item.name,
            duration_ms: data.item.duration_ms,
            explicit: data.item.explicit,
            artists: data.item.artists,
            album: data.item.album,
            preview_url: data.item.preview_url,
          };
          setCurrentTrack(trackData);
          console.log("Current track:", trackData);
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
    }, 15 * 1000);

    return () => clearInterval(interval);
  }, [isConnected]);

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

  return (
    <>
      <main>
        {!isConnected ? (
          <Card className="border-dashed">
            <CardHeader className="text-center">
              <CardTitle>Connect Your Spotify Account</CardTitle>
              <CardDescription>
                Connect your Spotify account to access your playlists and more
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center pb-6">
              <Button
                size="lg"
                className="gap-2"
                onClick={handleSpotifyConnect}
              >
                Connect with Spotify
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border bg-gradient-to-br from-zinc-900 to-zinc-800 p-4 sm:p-6 md:p-8 max-w-[28rem] ml-[5vh] hover:shadow-xl transition-all duration-300 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 pointer-events-none" />
            <div className="flex flex-row items-center gap-6 md:gap-8 relative z-10">
              <Avatar className="h-24 w-24 md:h-32 md:w-32 ring-4 ring-green-500/20 hover:ring-green-500/40 transition-all duration-300 shadow-xl flex-shrink-0">
                <AvatarImage
                  src={otherUserData?.images?.[0]?.url || "/default-avatar.png"}
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
                      <span className="text-white">{spotifyData.country}</span>
                    </p>
                  </div>
                </CardContent>
              )}
            </div>
          </Card>
        )}
      </main>
    </>
  );
};

export default SpotifyDashboard;
