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

const SpotifyDashboard = () => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [spotifyData, setSpotifyData] = useState<spotifyData | null>(null);
  const [otherUserData, setOtherUserData] = useState<spotifyOtherData | null>(
    null
  );

  const refreshSpotifyToken = async () => {
    try {
      const refreshToken = localStorage.getItem("spotify_refresh_token");
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/spotify/refresh`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
        }
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
    const checkConnection = async () => {
      const hasTokens = !!(
        localStorage.getItem("spotify_access_token") &&
        localStorage.getItem("spotify_refresh_token")
      );

      if (hasTokens) {
        const isValid = await checkTokenExpiration();
        setIsConnected(isValid);
        return;
      }

      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/spotify/status`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await response.json();
        setIsConnected(data.connected);
      } catch (error) {
        console.error("Failed to check Spotify status:", error);
        setIsConnected(false);
      }
    };

    checkConnection();

    const interval = setInterval(checkConnection, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);

    if (params.get("error")) {
      setError(params.get("error"));
      setIsConnected(false);
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
        setIsConnected(true);
        router.replace("/dashboard");
        localStorage.setItem("onPage", "spotify");
      } catch (error) {
        console.error("Failed to store Spotify tokens:", error);
        setError("Failed to complete Spotify connection");
        setIsConnected(false);
      }
    }
  }, [router]);

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

      setSpotifyData({
        display_name: data.display_name,
        country: data.country,
        email: data.email,
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
        <Card className="border">
          <Avatar className="mx-auto my-6">
            <AvatarImage
              src={otherUserData?.images?.[0]?.url || "/default-avatar.png"}
              alt="Spotify Avatar"
            />
            <AvatarFallback>
              {spotifyData?.display_name ? spotifyData.display_name[0] : "S"}
            </AvatarFallback>
          </Avatar>
          {spotifyData && (
            <CardContent className="text-center">
              <h3 className="font-medium">{spotifyData.display_name}</h3>
              <p className="text-sm text-muted-foreground">
                {spotifyData.email}
              </p>
              <p className="text-sm text-muted-foreground">
                {spotifyData.country}
              </p>
            </CardContent>
          )}
        </Card>
      )}
    </>
  );
};

export default SpotifyDashboard;
