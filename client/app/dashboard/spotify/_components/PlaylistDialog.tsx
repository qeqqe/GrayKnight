import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  SpotifyPlaylistItem,
  PlaylistResponse,
  SpotifyPlaylistTrack,
} from "../types";
import { playSpotifyTrack } from "@/lib/spotify";
import { QueueButton } from "./QueueButton";
import { Play } from "lucide-react";

interface PlaylistDialogProps {
  playlist: SpotifyPlaylistItem | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PlaylistDialog = ({
  playlist,
  isOpen,
  onOpenChange,
}: PlaylistDialogProps) => {
  const [tracks, setTracks] = useState<SpotifyPlaylistTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const loadingRef = useRef<HTMLDivElement>(null);

  const fetchTracks = async (url: string) => {
    try {
      const token = localStorage.getItem("spotify_access_token");
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch tracks");

      const data: PlaylistResponse = await response.json();
      setTracks((prev) => [...prev, ...data.items]);
      setNextUrl(data.next);
      setHasMore(!!data.next);
    } catch (error) {
      console.error("Failed to fetch playlist tracks:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && nextUrl) {
          setLoading(true);
          fetchTracks(nextUrl);
        }
      },
      { threshold: 0.5 }
    );

    if (loadingRef.current) {
      observer.observe(loadingRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, nextUrl]);

  useEffect(() => {
    const fetchTracks = async () => {
      if (!playlist?.id) return;
      try {
        const token = localStorage.getItem("spotify_access_token");
        const response = await fetch(`${playlist.tracks.href}?limit=50`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error("Failed to fetch tracks");

        const data: PlaylistResponse = await response.json();
        setTracks((prev) => [...prev, ...data.items]);
        setNextUrl(data.next);
        setHasMore(!!data.next);
      } catch (error) {
        console.error("Failed to fetch playlist tracks:", error);
      } finally {
        setLoading(false);
      }
    };

    if (!isOpen) {
      setTracks([]);
      setNextUrl(null);
      setHasMore(true);
      setLoading(true);
      return;
    }

    fetchTracks();
  }, [playlist?.id, isOpen]);

  const handlePlay = async (trackId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await playSpotifyTrack({
        context_uri: `spotify:playlist:${playlist?.id}`,
        offset: {
          uri: `spotify:track:${trackId}`,
        },
        position_ms: 0,
      });
    } catch (error) {
      console.error("Failed to play track:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="bg-zinc-50 dark:bg-zinc-900 pb-4 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src={playlist?.images[0]?.url || "/placeholder.png"}
                alt={playlist?.name}
                className="w-16 h-16 object-cover rounded-md"
              />
              <div>
                <DialogTitle className="text-2xl font-bold text-zinc-900 dark:text-white">
                  {playlist?.name}
                </DialogTitle>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {playlist?.tracks.total} tracks
                </p>
              </div>
            </div>
            <Button
              onClick={() =>
                window.open(playlist?.external_urls.spotify, "_blank")
              }
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              Open in Spotify
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto mt-4 spotify-scrollbar">
          <div className="space-y-2 px-6">
            {tracks.map((item, index) => (
              <div
                key={item.track.id + index}
                className="flex items-center gap-3 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 rounded-md group"
              >
                <img
                  src={item.track.album.images[2]?.url || "/placeholder.png"}
                  alt={item.track.album.name}
                  className="w-10 h-10 object-cover rounded"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-zinc-900 dark:text-white truncate">
                    {item.track.name}
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 truncate">
                    {item.track.artists.map((a) => a.name).join(", ")}
                  </p>
                </div>
                <div className="text-zinc-600 dark:text-zinc-500 text-sm">
                  {Math.floor(item.track.duration_ms / 60000)}:
                  {((item.track.duration_ms % 60000) / 1000)
                    .toFixed(0)
                    .padStart(2, "0")}
                </div>
                {item.track.external_urls.spotify && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => handlePlay(item.track.id, e)}
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                    <QueueButton trackId={item.track.id} />
                  </div>
                )}
              </div>
            ))}

            <div ref={loadingRef} className="py-4 flex justify-center">
              {loading && (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
