import { Button } from "@/components/ui/button";
import { formatDistance } from "date-fns";
import { RecentlyPlayedItem } from "../types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { playSpotifyTrack } from "@/lib/spotify";

export const RecentlyPlayed = ({ items }: { items: RecentlyPlayedItem[] }) => {
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
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white">Recently Played</h2>
      {items.length > 0 ? (
        <ScrollArea className="h-[22rem] rounded-md">
          <div className="space-y-2 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-lg p-4">
            {items.map((item) => (
              <div
                key={`${item.track.id}-${item.played_at}`}
                className="flex items-center gap-3 p-2 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/50 rounded-md group"
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
                    {item.track.artists.map((artist) => artist.name).join(", ")}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {formatDistance(new Date(item.played_at), new Date(), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => handlePlay(item.track.id, e)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Play
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      ) : (
        <p className="text-zinc-600 dark:text-zinc-500 text-center py-4">
          No recently played tracks
        </p>
      )}
    </div>
  );
};
