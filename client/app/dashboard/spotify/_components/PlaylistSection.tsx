import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { SpotifyPlaylistItem } from "../types";
import { PlaylistDialog } from "./PlaylistDialog";

export const PlaylistSection = ({
  playlists,
  openPlaylistId,
  setOpenPlaylistId,
}: {
  playlists: SpotifyPlaylistItem[];
  openPlaylistId: string | null;
  setOpenPlaylistId: (id: string | null) => void;
}) => {
  const [showAll, setShowAll] = useState(false);
  const INITIAL_SHOW_COUNT = 4;

  if (!Array.isArray(playlists) || playlists.length === 0) return null;

  const validPlaylists = playlists.filter(
    (p) => p && p.id && p.name && p.images && Array.isArray(p.images)
  );

  if (validPlaylists.length === 0) return null;

  const displayedPlaylists = showAll
    ? validPlaylists
    : validPlaylists.slice(0, INITIAL_SHOW_COUNT);

  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-2">Your Playlists</h2>
      <div className="space-y-2">
        {displayedPlaylists.map((playlist) => {
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

        {validPlaylists.length > INITIAL_SHOW_COUNT && (
          <Button
            variant="ghost"
            className="w-full mt-2 text-zinc-400 hover:text-white hover:bg-zinc-800/50"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? (
              <span className="flex items-center gap-2">
                Show Less <ChevronUp className="w-4 h-4" />
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Show More ({validPlaylists.length - INITIAL_SHOW_COUNT} more){" "}
                <ChevronDown className="w-4 h-4" />
              </span>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};
