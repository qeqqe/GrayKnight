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

  useEffect(() => {
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

        // Clean up URL parameters
        router.replace("/dashboard/spotify");
      } catch (error) {
        console.error("Failed to store Spotify tokens:", error);
        setError("Failed to complete Spotify connection");
      }
    }
  }, []);

  const handleSpotifyConnect = () => {
    // Just redirect to the auth endpoint
    window.location.href = `${
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
    }/auth/spotify`;
  };

  const isConnected = !!localStorage.getItem("spotify_access_token");

  return (
    <Card className="border-dashed">
      <CardHeader className="text-center">
        <CardTitle>
          {isConnected ? "Spotify Connected" : "Connect Your Spotify Account"}
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
