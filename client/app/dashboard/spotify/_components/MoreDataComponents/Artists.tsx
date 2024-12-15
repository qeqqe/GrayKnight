import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

interface Artist {
  id: string;
  name: string;
  images: { url: string }[];
  followers: { total: number };
  popularity: number;
}

const Artists = () => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopArtists = async () => {
      try {
        const token = localStorage.getItem("spotify_access_token");
        const response = await fetch(
          "https://api.spotify.com/v1/me/top/artists?limit=50&time_range=short_term",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) throw new Error("Failed to fetch artists");

        const data = await response.json();
        setArtists(data.items);
      } catch (error) {
        console.error("Failed to fetch top artists:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopArtists();
  }, []);

  const maxPopularity = Math.max(
    ...(artists?.map((a) => a.popularity) || [100])
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Top Artists</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {artists.map((artist, i) => (
            <div key={artist.id} className="flex items-center gap-4 mb-4">
              <Avatar>
                <AvatarImage src={artist.images[0]?.url} />
                <AvatarFallback>{artist.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="font-medium">{artist.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {artist.followers.total.toLocaleString()} followers
                  </span>
                </div>
                <Progress value={(artist.popularity / maxPopularity) * 100} />
              </div>
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default Artists;
