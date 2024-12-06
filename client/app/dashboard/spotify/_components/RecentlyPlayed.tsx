import { Button } from "@/components/ui/button";
import { formatDistance } from "date-fns";
import { RecentlyPlayedItem } from "../types";

export const RecentlyPlayed = ({ items }: { items: RecentlyPlayedItem[] }) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white">Recently Played</h2>
      {items.length > 0 ? (
        <div className="space-y-2 bg-zinc-900/50 rounded-lg p-4">
          {items.map((item) => (
            <div
              key={`${item.track.id}-${item.played_at}`}
              className="flex items-center gap-3 p-2 hover:bg-zinc-800/50 rounded-md group"
            >
              <img
                src={item.track.album.images[2]?.url || "/placeholder.png"}
                alt={item.track.album.name}
                className="w-10 h-10 object-cover rounded"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate">
                  {item.track.name}
                </p>
                <p className="text-sm text-zinc-400 truncate">
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
                onClick={() =>
                  window.open(item.track.external_urls.spotify, "_blank")
                }
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Play
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-zinc-500 text-center py-4">
          No recently played tracks
        </p>
      )}
    </div>
  );
};
