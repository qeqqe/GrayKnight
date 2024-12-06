import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { SpotifyPlaylistItem } from "../types";
import { PlaylistDialog } from "./PlaylistDialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export const PlaylistSection = ({
  playlists,
  openPlaylistId,
  setOpenPlaylistId,
}: {
  playlists: SpotifyPlaylistItem[];
  openPlaylistId: string | null;
  setOpenPlaylistId: (id: string | null) => void;
}) => {
  if (!Array.isArray(playlists) || playlists.length === 0) return null;

  const validPlaylists = playlists.filter(
    (p) => p && p.id && p.name && p.images && Array.isArray(p.images)
  );

  if (validPlaylists.length === 0) return null;

  return (
    <div className="space-y-2">
      <h2 className="text-xl font-semibold text-white sticky top-0 bg-background z-10">
        Your Playlists ({validPlaylists.length})
      </h2>

      <div className="h-[320px] overflow-y-auto pr-4 space-y-2">
        {validPlaylists.map((playlist) => {
          const imageUrl = playlist?.images?.[0]?.url || "/placeholder.png";
          const playlistName = playlist?.name || "Untitled Playlist";
          const trackCount = playlist?.tracks?.total ?? 0;

          return (
            <div key={playlist.id}>
              <Card
                className="bg-zinc-900/50 hover:bg-zinc-900 transition-colors cursor-pointer"
                onClick={() => setOpenPlaylistId(playlist.id)}
              >
                <CardContent className="flex items-center gap-3 p-3">
                  <img
                    src={imageUrl}
                    alt={playlistName}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div>
                    <h3 className="font-medium text-white">{playlistName}</h3>
                    <p className="text-sm text-zinc-400">{trackCount} tracks</p>
                  </div>
                </CardContent>
              </Card>
              <PlaylistDialog
                playlist={playlist}
                isOpen={openPlaylistId === playlist.id}
                onOpenChange={(open) =>
                  setOpenPlaylistId(open ? playlist.id : null)
                }
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
