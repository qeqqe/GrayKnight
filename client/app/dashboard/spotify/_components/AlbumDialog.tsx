import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { PlayCircle, Plus } from "lucide-react";
import { playSpotifyTrack, addToQueue } from "@/lib/spotify";
import { SpotifyAlbum } from "../types";

interface AlbumDialogProps {
  album: SpotifyAlbum | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AlbumDialog = ({
  album,
  isOpen,
  onOpenChange,
}: AlbumDialogProps) => {
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTracks = async () => {
      if (!album?.id) return;
      setLoading(true);
      try {
        const token = localStorage.getItem("spotify_access_token");
        const response = await fetch(
          `https://api.spotify.com/v1/albums/${album.id}/tracks`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await response.json();
        setTracks(data.items);
      } catch (error) {
        console.error("Failed to fetch album tracks:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchTracks();
    }
  }, [album?.id, isOpen]);

  const handlePlay = async (trackUri: string) => {
    try {
      await playSpotifyTrack({
        context_uri: `spotify:album:${album?.id}`,
        offset: {
          uri: trackUri,
        },
      });
    } catch (error) {
      console.error("Failed to play track:", error);
    }
  };

  const handleAddToQueue = async (uri: string) => {
    try {
      await addToQueue(uri);
    } catch (error) {
      console.error("Failed to add to queue:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{album?.name}</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {tracks.map((track) => (
                <div
                  key={track.id}
                  className="flex items-center justify-between p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg group"
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <p className="font-medium truncate">{track.name}</p>
                    <p className="text-sm text-zinc-500 truncate">
                      {track.artists.map((a: any) => a.name).join(", ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handlePlay(track.uri)}
                    >
                      <PlayCircle className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleAddToQueue(track.uri)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
