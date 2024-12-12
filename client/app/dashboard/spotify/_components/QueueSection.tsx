import { Button } from "@/components/ui/button";
import { spotifyTrack } from "../types";
import { playSpotifyTrack } from "@/lib/spotify";
import { ScrollArea } from "@radix-ui/react-scroll-area";

export const QueueSection = ({ queue }: { queue: spotifyTrack[] }) => {
  if (!queue.length) {
    return (
      <div className="flex items-center justify-center h-[300px] text-zinc-500">
        <p className="text-center">
          Queue is empty
          <br />
          <span className="text-sm">Add some tracks to your queue</span>
        </p>
      </div>
    );
  }

  // play selected track
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
    <div className="h-full flex flex-col">
      <ScrollArea className="flex-1 -mr-6 pr-6">
        {queue.slice(0, 5).map((track, index) => (
          <div
            key={track.id + index}
            className="flex items-center gap-3 p-3 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/50 rounded-md group"
          >
            <img
              src={track.album.images[2]?.url || "/placeholder.png"}
              alt={track.album.name}
              className="w-10 h-10 object-cover rounded"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-zinc-900 dark:text-white truncate">
                {track.name}
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 truncate">
                {track.artists.map((a) => a.name).join(", ")}
              </p>
            </div>
            <div className="text-zinc-600 dark:text-zinc-500 text-sm">
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
      </ScrollArea>
    </div>
  );
};
