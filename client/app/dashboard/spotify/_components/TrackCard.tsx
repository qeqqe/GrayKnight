import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { spotifyTrack } from "../types";

export const TrackCard = ({ track }: { track: spotifyTrack }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const formattedDuration = `${Math.floor(track.duration_ms / 60000)}:${(
    (track.duration_ms % 60000) /
    1000
  )
    .toFixed(0)
    .padStart(2, "0")}`;

  const formattedProgress = `${Math.floor(track.progress_ms / 60000)}:${(
    (track.progress_ms % 60000) /
    1000
  )
    .toFixed(0)
    .padStart(2, "0")}`;

  const progressPercentage = (track.progress_ms / track.duration_ms) * 100;

  const formattedDate = track.album.release_date
    ? format(new Date(track.album.release_date), "dd/MM/yyyy")
    : "Release date unavailable";

  console.log("Track in card:", track);

  return (
    <>
      <Card
        onClick={() => setIsModalOpen(true)}
        className="mt-6 cursor-pointer group hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-zinc-900/50 to-zinc-800/50 border-zinc-700/50"
      >
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 group-hover:w-20 group-hover:h-20 transition-all duration-300">
              <img
                src={track.album.images[0]?.url}
                alt={track.album.name}
                className="w-full h-full object-cover rounded-md shadow-lg"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-all duration-300 rounded-md" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-white group-hover:text-green-400 transition-colors">
                {track.name}
              </h3>
              <p className="text-zinc-400 text-sm">
                {track.artists.map((artist) => artist.name).join(", ")}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-zinc-500">
                  {formattedProgress} / {formattedDuration}
                </span>
                {track.explicit && (
                  <span className="text-xs px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded">
                    Explicit
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-500 ease-linear"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Track Details
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-[200px,1fr] gap-6 mt-4">
            <div className="space-y-4">
              <img
                src={track.album.images[0]?.url}
                alt={track.album.name}
                className="w-full aspect-square object-cover rounded-lg shadow-xl"
              />
              <div className="space-y-1">
                <p className="text-sm font-medium text-zinc-400">Album</p>
                <p className="font-semibold">{track.album.name}</p>
                <p className="text-sm text-zinc-500">
                  Released: {formattedDate}
                </p>
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-green-400">
                  {track.name}
                </h3>
                <p className="text-lg text-zinc-400">
                  {track.artists.map((artist) => artist.name).join(", ")}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-zinc-400">Timestamp:</span>
                  <span className="text-sm">
                    {formattedProgress} / {formattedDuration}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all duration-500 ease-linear"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-zinc-400">Duration:</span>
                  <span>{formattedDuration}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-zinc-400">Popularity:</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="w-full max-w-[200px] h-2 bg-zinc-800 rounded-full overflow-hidden cursor-help relative group">
                          <div
                            className="h-full bg-green-500"
                            style={{ width: `${track.popularity}%` }}
                          />
                          <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/90 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                            {track.popularity}/100
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-sm font-medium">
                          Popularity Score: {track.popularity}/100
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                {track.preview_url && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-zinc-400">Preview:</span>
                      <audio
                        controls
                        className="w-full h-8 [&::-webkit-media-controls-panel]:bg-zinc-800 [&::-webkit-media-controls-current-time-display]:text-white [&::-webkit-media-controls-time-remaining-display]:text-white"
                      >
                        <source src={track.preview_url} type="audio/mpeg" />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-4">
                <Button
                  onClick={() =>
                    window.open(track.album.external_urls.spotify, "_blank")
                  }
                  className="bg-green-500 hover:bg-green-600"
                >
                  Open in Spotify
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
