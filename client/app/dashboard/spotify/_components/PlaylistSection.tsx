import { Card, CardContent } from "@/components/ui/card";
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
  if (!playlists.length) return null;

  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-2">Your Playlists</h2>
      <div className="space-y-2">
        {playlists.map((playlist) => (
          <div key={playlist.id}>
            <Card
              className="bg-zinc-900/50 hover:bg-zinc-900 transition-colors cursor-pointer"
              onClick={() => setOpenPlaylistId(playlist.id)}
            >
              <CardContent className="flex items-center gap-3 p-3">
                <img
                  src={playlist.images[0]?.url || "/placeholder.png"}
                  alt={playlist.name}
                  className="w-12 h-12 object-cover rounded"
                />
                <div>
                  <h3 className="font-medium text-white">{playlist.name}</h3>
                  <p className="text-sm text-zinc-400">
                    {playlist.tracks.total} tracks
                  </p>
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
        ))}
      </div>
    </div>
  );
};
