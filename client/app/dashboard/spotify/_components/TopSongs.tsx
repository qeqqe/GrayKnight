import React, { useEffect, useState } from "react";
import { fetchTopItems } from "@/lib/spotify";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface trackProps {
  items: Item[];
  total: number;
  limit: number;
  offset: number;
  href: string;
  next: string;
  previous: null;
}

interface Item {
  album: Album;
  artists: Artist[];
  available_markets: string[];
  disc_number: number;
  duration_ms: number;
  explicit: boolean;
  external_ids: Externalids;
  external_urls: Externalurls;
  href: string;
  id: string;
  is_local: boolean;
  is_playable: boolean;
  name: string;
  popularity: number;
  preview_url: null;
  track_number: number;
  type: string;
  uri: string;
}

interface Externalids {
  isrc: string;
}

interface Album {
  album_type: string;
  artists: Artist[];
  available_markets: string[];
  external_urls: Externalurls;
  href: string;
  id: string;
  images: Image[];
  is_playable: boolean;
  name: string;
  release_date: string;
  release_date_precision: string;
  total_tracks: number;
  type: string;
  uri: string;
}

interface Image {
  height: number;
  url: string;
  width: number;
}

interface Artist {
  external_urls: Externalurls;
  href: string;
  id: string;
  name: string;
  type: string;
  uri: string;
}

interface Externalurls {
  spotify: string;
}

const TopSongs = () => {
  const [tracksPeriod, setTracksPeriod] = useState<
    "short_term" | "medium_term" | "long_term"
  >("short_term");
  const [tracks, setTracks] = useState<trackProps | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await fetchTopItems("tracks", tracksPeriod);
        setTracks(data);
      } catch (error) {
        console.error("Error fetching tracks:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [tracksPeriod]);

  const loadMore = async () => {
    if (!tracks?.next) return;
    const response = await fetch(tracks.next, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("spotify_access_token")}`,
      },
    });
    const data = await response.json();
    setTracks((prev) => ({
      ...data,
      items: [...(prev?.items ?? []), ...data.items],
    }));
  };

  return (
    <div className="p-4">
      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Top Tracks</CardTitle>
              <CardDescription>Your top tracks</CardDescription>
            </div>
            <select
              value={tracksPeriod}
              onChange={(e) =>
                setTracksPeriod(
                  e.target.value as "short_term" | "medium_term" | "long_term"
                )
              }
              className="p-2 rounded-md border bg-background"
            >
              <option value="short_term">Last Month</option>
              <option value="medium_term">Last 6 Months</option>
              <option value="long_term">Last Year</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4 min-w-[80%]">
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                Loading...
              </div>
            ) : (
              <>
                {tracks?.items.map((track) => (
                  <div
                    key={track.id}
                    className="flex items-center space-x-4 mb-4"
                  >
                    <Avatar>
                      <AvatarImage
                        src={track.album.images[0]?.url || ""}
                        alt={track.name}
                      />
                      <AvatarFallback>{track.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <a
                          href={track.external_urls.spotify}
                          target="_blank"
                          rel="noreferrer"
                          className="text-lg font-semibold hover:underline"
                        >
                          {track.name}
                        </a>
                        <span className="text-xs text-muted-foreground">
                          Popularity: {track.popularity}% •{" "}
                          {Math.floor(track.duration_ms / 60000)}:
                          {Math.floor((track.duration_ms % 60000) / 1000)
                            .toString()
                            .padStart(2, "0")}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {track.artists.map((artist) => artist.name).join(", ")}
                      </p>
                    </div>
                  </div>
                ))}
                {tracks?.next && (
                  <Button variant="ghost" onClick={loadMore}>
                    Load more
                  </Button>
                )}
              </>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default TopSongs;
