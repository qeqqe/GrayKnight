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
import { useRouter } from "next/navigation";

const SpotifyDashboard = () => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Check connection status on mount
    const checkSpotifyStatus = async () => {
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
      }
    };

    checkSpotifyStatus();

    // Handle redirect params
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);

      if (params.get("error")) {
        setError(params.get("error"));
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
          // Change this line to redirect to main dashboard
          router.replace("/dashboard");
          // Set onPage in localStorage to spotify
          localStorage.setItem("onPage", "spotify");
        } catch (error) {
          console.error("Failed to store Spotify tokens:", error);
          setError("Failed to complete Spotify connection");
        }
      }
    }
  }, []);

  const handleSpotifyConnect = () => {
    const token =
      typeof window !== "undefined"
        ? window.localStorage.getItem("token")
        : null;

    // Direct redirect with token in query parameter
    window.location.href = `${
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
    }/auth/spotify?token=${token}`;
  };

  return (
    <Card className="border-dashed">
      <CardHeader className="text-center">
        <CardTitle>
          {isConnected ? "Spotify Connected!" : "Connect Your Spotify Account"}
        </CardTitle>
        <CardDescription>
          {isConnected
            ? "Your Spotify account is connected and ready to use"
            : "Connect your Spotify account to access your playlists and more"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center pb-6">
        {!isConnected && (
          <Button size="lg" className="gap-2" onClick={handleSpotifyConnect}>
            Connect with Spotify
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default SpotifyDashboard;
