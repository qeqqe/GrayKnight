import { Loader2 } from "lucide-react"; // Add this import
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import React, { useEffect, useState } from "react";
import { SpotifyPlaylistTrack } from "../types";
import { fetchArtistTopTracks } from "@/lib/spotify";
import { QueueButton } from "./QueueButton";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { playSpotifyTrack } from "@/lib/spotify";
import { Play } from "lucide-react";
interface ArtistDialogChange {
  artistId?: string | null;
  artistName?: string;
  artistImage?: string;
  IsOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TrackProp {
  album: Album;
  artists: Artist[];
  disc_number: number;
  duration_ms: number;
  explicit: boolean;
  external_ids: Externalids;
  external_urls: Externalurls;
  href: string;
  id: string;
  is_local: boolean;
  is_playable: boolean;
  name: string;
  popularity: number;
  preview_url: null;
  track_number: number;
  type: string;
  uri: string;
}

interface Externalids {
  isrc: string;
}

interface Album {
  album_type: string;
  artists: Artist[];
  external_urls: Externalurls;
  href: string;
  id: string;
  images: Image[];
  is_playable: boolean;
  name: string;
  release_date: string;
  release_date_precision: string;
  total_tracks: number;
  type: string;
  uri: string;
}

interface Image {
  url: string;
  height: number;
  width: number;
}

interface Artist {
  external_urls: Externalurls;
  href: string;
  id: string;
  name: string;
  type: string;
  uri: string;
}

interface Externalurls {
  spotify: string;
}

const formatDuration = (ms: number) => {
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}:${Number(seconds) < 10 ? "0" : ""}${seconds}`;
};

const ArtistTopTrackDialog = ({
  artistId,
  artistName,
  artistImage,
  IsOpen,
  onOpenChange,
}: ArtistDialogChange) => {
  const [tracks, setTracks] = useState<TrackProp[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [isSpotifyOpen, setIsSpotifyOpen] = useState<boolean>(false);

  const activeDeviceId: string | undefined =
    localStorage.getItem("active_device_id") || undefined;

  useEffect(() => {
    if (!artistId) return;
    setLoading(true);
    fetchArtistTopTracks(artistId)
      .then((data) => {
        setTracks(data.tracks);
        setLoading(false);
      })
      .catch((error) => {
        setError(error.message);
        setLoading(false);
      });
  }, [artistId]);

  useEffect(() => {
    const checkSpotifyStatus = async () => {
      try {
        const response = await fetch("https://api.spotify.com/v1/me/player", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem(
              "spotify_access_token"
            )}`,
          },
        });

        if (response.status === 200) {
          const data = await response.json();
          if (data.device) {
            setIsSpotifyOpen(true);
            localStorage.setItem("active_device_id", data.device.id);
          }
        } else {
          setIsSpotifyOpen(false);
        }
      } catch (error) {
        setIsSpotifyOpen(false);
      }
    };

    checkSpotifyStatus();
    const interval = setInterval(checkSpotifyStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const handlePlayTrack = async (track: TrackProp) => {
    if (!isSpotifyOpen) {
      setPlaybackError(
        "Please open Spotify app and start playing any track first"
      );
      return;
    }

    try {
      setPlayingTrackId(track.id);
      setPlaybackError(null);
      await playSpotifyTrack({
        uri: track.uri,
        deviceId: activeDeviceId,
        position_ms: 0,
      });
    } catch (error) {
      setPlaybackError(
        "Playback failed. Please try refreshing the page or check your Spotify connection."
      );
    } finally {
      setPlayingTrackId(null);
    }
  };

  return (
    <Dialog open={IsOpen} onOpenChange={onOpenChange}>
      <TooltipProvider>
        <DialogContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader className="bg-zinc-50 dark:bg-zinc-900 pb-4 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
            <DialogTitle className="mb-2 text-xl">Top Tracks</DialogTitle>
            {tracks.length > 0 && (
              <div className="flex items-center gap-4">
                <img
                  src={artistImage}
                  alt={artistName}
                  className="w-16 h-16 object-cover rounded-md"
                />
                <div>
                  <DialogTitle>{artistName}</DialogTitle>
                  <p className="text-sm text-zinc-500">
                    {tracks.length} top tracks
                  </p>
                </div>
              </div>
            )}
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-4">
            {!isSpotifyOpen && (
              <div className="flex items-center gap-2 text-yellow-500 p-2 mb-4 bg-yellow-100 dark:bg-yellow-900/20 rounded">
                <Loader2 className="w-4 h-4 animate-spin" />
                <p>
                  Waiting for Spotify... Please open Spotify and play any track
                </p>
              </div>
            )}
            {playbackError && (
              <div className="text-red-500 p-2 mb-4 bg-red-100 dark:bg-red-900/20 rounded">
                {playbackError}
              </div>
            )}
            {loading &&
              Array(10)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="flex items-center gap-4 mb-4">
                    <Skeleton className="w-12 h-12 rounded" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-[200px] mb-2" />
                      <Skeleton className="h-3 w-[150px]" />
                    </div>
                  </div>
                ))}
            {error && <div className="text-red-500">{error}</div>}
            {tracks.map((track) => (
              <div
                key={track.id}
                className="flex items-center gap-4 mb-4 p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors group"
              >
                <div className="relative">
                  <img
                    src={track.album.images[track.album.images.length - 1].url}
                    alt={track.name}
                    className="w-12 h-12 flex-shrink-0 object-cover rounded"
                  />
                  <button
                    onClick={() => handlePlayTrack(track)}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center"
                    disabled={playingTrackId === track.id}
                  >
                    {playingTrackId === track.id ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Play className="w-6 h-6 text-white" />
                    )}
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{track.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-zinc-500 truncate">
                    <span className="truncate">
                      {track.artists.map((a) => a.name).join(", ")}
                    </span>
                    <span className="flex-shrink-0">•</span>
                    <span className="truncate">{track.album.name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-zinc-500 flex-shrink-0">
                  <span className="w-16 text-right flex-shrink-0">
                    {formatDuration(track.duration_ms)}
                  </span>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="w-12 text-right flex-shrink-0">
                        <div className="h-1 w-full bg-zinc-200 dark:bg-zinc-700 rounded">
                          <div
                            className="h-full bg-green-500 rounded"
                            style={{ width: `${track.popularity}%` }}
                          />
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Popularity: {track.popularity}%</p>
                    </TooltipContent>
                  </Tooltip>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <QueueButton trackId={track.id} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </TooltipProvider>
    </Dialog>
  );
};

export default ArtistTopTrackDialog;
