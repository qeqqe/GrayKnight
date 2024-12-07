import { Button } from "@/components/ui/button";
import { spotifyTrack } from "../types";
import { playSpotifyTrack } from "@/lib/spotify";

export const QueueSection = ({ queue }: { queue: spotifyTrack[] }) => {
  if (!queue.length) return null;

  const handlePlay = async (trackId: string, e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await playSpotifyTrack({
        uris: [`spotify:track:${trackId}`],
      });
    } catch (error) {
      console.error("Failed to play track:", error);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-2">Queue</h2>
      <div className="space-y-2 bg-zinc-900/50 rounded-lg p-4">
        {queue.slice(0, 5).map((track, index) => (
          <div
            key={track.id + index}
            className="flex items-center gap-3 p-2 hover:bg-zinc-800/50 rounded-md group"
          >
            <img
              src={track.album.images[2]?.url || "/placeholder.png"}
              alt={track.album.name}
              className="w-10 h-10 object-cover rounded"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white truncate">{track.name}</p>
              <p className="text-sm text-zinc-400 truncate">
                {track.artists.map((a) => a.name).join(", ")}
              </p>
            </div>
            <div className="text-zinc-500 text-sm">
              {Math.floor(track.duration_ms / 60000)}:
              {((track.duration_ms % 60000) / 1000).toFixed(0).padStart(2, "0")}
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => handlePlay(track.id, e)}
            >
              Play
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
