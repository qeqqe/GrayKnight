import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserPlus, ExternalLink, Users } from "lucide-react";

interface Artist {
  id: string;
  name: string;
  images: { url: string; height: number; width: number }[];
  followers: { total: number };
  genres: string[];
  external_urls: { spotify: string };
  popularity: number;
}

interface FollowingResponse {
  artists: {
    items: Artist[];
    total: number;
    cursors?: { after: string };
  };
}

interface FollowedArtistsProps {
  onTotalFollowingChange?: (total: number) => void;
}

const FollowedArtists = ({ onTotalFollowingChange }: FollowedArtistsProps) => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalFollowing, setTotalFollowing] = useState(0);

  const fetchFollowing = async (afterCursor?: string) => {
    try {
      const token = localStorage.getItem("spotify_access_token");
      const url = new URL("https://api.spotify.com/v1/me/following");
      url.searchParams.append("type", "artist");
      url.searchParams.append("limit", "50");
      if (afterCursor) {
        url.searchParams.append("after", afterCursor);
      }

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch following");

      const data: FollowingResponse = await response.json();
      setTotalFollowing(data.artists.total);
      onTotalFollowingChange?.(data.artists.total);

      if (afterCursor) {
        setArtists((prev) => [...prev, ...data.artists.items]);
      } else {
        setArtists(data.artists.items);
      }

      setHasMore(!!data.artists.cursors?.after);
      setCursor(data.artists.cursors?.after || null);
    } catch (error) {
      console.error("Error fetching following:", error);
      setError("Failed to load followed artists");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowing();
  }, []);

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

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <Card key={i} className="flex items-center space-x-4 p-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-4 w-[150px]" />
          </div>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {loading ? (
        <LoadingSkeleton />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {artists.map((artist) => (
            <Card
              key={artist.id}
              className="hover:bg-accent/50 transition-colors"
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage
                      src={artist.images[0]?.url}
                      alt={artist.name}
                    />
                    <AvatarFallback>{artist.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold truncate">
                        {artist.name}
                      </h3>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() =>
                                window.open(
                                  artist.external_urls.spotify,
                                  "_blank"
                                )
                              }
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Open in Spotify</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <p className="text-sm text-zinc-500">
                      {artist.followers.total.toLocaleString()} followers
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {artist.genres.slice(0, 2).map((genre) => (
                        <span
                          key={genre}
                          className="px-2 py-0.5 text-xs bg-accent rounded-full"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {hasMore && !loading && (
        <div className="flex justify-center mt-6">
          <Button
            variant="outline"
            onClick={() => fetchFollowing(cursor!)}
            className="w-full max-w-xs"
          >
            Load More Artists
          </Button>
        </div>
      )}
    </div>
  );
};

export default FollowedArtists;
