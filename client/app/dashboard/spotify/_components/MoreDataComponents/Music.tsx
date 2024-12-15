import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import Image from "next/image";

interface Track {
  id: string;
  name: string;
  album: {
    images: { url: string }[];
  };
  artists: { name: string }[];
  duration_ms: number;
  popularity: number;
}

const Music = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopTracks = async () => {
      try {
        const token = localStorage.getItem("spotify_access_token");
        const response = await fetch(
          "https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=short_term",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) throw new Error("Failed to fetch tracks");

        const data = await response.json();
        setTracks(data.items);
      } catch (error) {
        console.error("Failed to fetch top tracks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopTracks();
  }, []);

  const maxPopularity = Math.max(
    ...(tracks?.map((t) => t.popularity) || [100])
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Top Tracks</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {tracks.map((track, i) => (
            <div key={track.id} className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 relative rounded-md overflow-hidden">
                <img
                  src={track.album.images[0]?.url}
                  alt={track.name}
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <div>
                    <p className="font-medium">{track.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {track.artists.map((a) => a.name).join(", ")}
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {Math.floor(track.duration_ms / 60000)}:
                    {Math.floor((track.duration_ms % 60000) / 1000)
                      .toString()
                      .padStart(2, "0")}
                  </span>
                </div>
                <Progress value={(track.popularity / maxPopularity) * 100} />
              </div>
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default Music;
