import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, ExternalLink, Clock } from "lucide-react";
import { format } from "date-fns";
import { spotifyTrack } from "../types";

interface SavedTrackItem {
  added_at: string;
  track: spotifyTrack;
}

interface SavedTracksResponse {
  href: string;
  items: SavedTrackItem[];
  limit: number;
  next: string | null;
  offset: number;
  previous: string | null;
  total: number;
}

const SavedTrack = () => {
  const [savedTracks, setSavedTracks] = useState<SavedTrackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchSavedTracks = async (currentOffset: number = 0) => {
    try {
      const token = localStorage.getItem("spotify_access_token");
      const response = await fetch(
        `https://api.spotify.com/v1/me/tracks?limit=${limit}&offset=${currentOffset}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch saved tracks");

      const data: SavedTracksResponse = await response.json();

      if (currentOffset === 0) {
        setSavedTracks(data.items);
      } else {
        setSavedTracks((prev) => [...prev, ...data.items]);
      }

      setTotal(data.total);
      setHasMore(data.next !== null);
      setOffset(currentOffset + limit);
    } catch (error) {
      console.error("Error fetching saved tracks:", error);
      setError("Failed to load saved tracks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedTracks();
  }, []);

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-16 w-16" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[150px]" />
              </div>
              <Skeleton className="h-4 w-[100px]" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="text-center text-destructive">
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${parseInt(seconds) < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-red-500" />
          <h2 className="text-2xl font-bold">Saved Tracks</h2>
          <span className="text-sm text-zinc-500">({total})</span>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-12rem)]">
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <div className="space-y-4">
            {savedTracks.map((item) => (
              <Card
                key={item.track.id}
                className="hover:bg-accent/50 transition-colors group"
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={item.track.album.images[2]?.url}
                      alt={item.track.album.name}
                      className="w-16 h-16 rounded-md shadow-sm"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate flex items-center gap-2">
                        {item.track.name}
                        {item.track.explicit && (
                          <span className="px-1.5 py-0.5 text-[10px] font-medium bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded">
                            E
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-zinc-500 truncate">
                        {item.track.artists
                          .map((artist) => artist.name)
                          .join(", ")}
                      </p>
                      <p className="text-xs text-zinc-400">
                        {item.track.album.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-zinc-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDuration(item.track.duration_ms)}
                      </div>
                      <div className="text-xs">
                        Added {format(new Date(item.added_at), "MMM d, yyyy")}
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => {
                          const spotifyUrl = item.track.external_urls?.spotify;
                          if (spotifyUrl) {
                            window.open(spotifyUrl, "_blank");
                          }
                        }}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {hasMore && !loading && (
              <div className="flex justify-center pt-4 pb-8">
                <Button
                  variant="outline"
                  onClick={() => fetchSavedTracks(offset)}
                  className="w-full max-w-xs"
                >
                  Load More Tracks
                </Button>
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default SavedTrack;
