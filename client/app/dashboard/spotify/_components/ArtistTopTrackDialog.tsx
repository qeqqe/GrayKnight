import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import React, { useEffect, useState } from "react";
import { SpotifyPlaylistTrack } from "../types";
import { fetchArtistTopTracks } from "@/lib/spotify";
interface ArtistDialogChange {
  artistId?: string | null;
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
const ArtistTopTrackDialog = ({
  artistId,
  IsOpen,
  onOpenChange,
}: ArtistDialogChange) => {
  const [tracks, setTracks] = useState<TrackProp[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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
  return (
    <Dialog open={IsOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="bg-zinc-50 dark:bg-zinc-900 pb-4 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
          <DialogTitle className="mb-2 text-xl">Top Tracks</DialogTitle>
          {tracks.length > 0 && (
            <div className="flex items-center gap-4">
              <img
                src={tracks[0].album.images[0].url}
                alt={tracks[0].name}
                className="w-16 h-16 object-cover rounded-md"
              />
              <div>
                <DialogTitle>{tracks[0].artists[0].name}</DialogTitle>
              </div>
            </div>
          )}
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-4">
          {loading && <div>Loading...</div>}
          {error && <div className="text-red-500">{error}</div>}
          {tracks.map((track) => (
            <div key={track.id} className="flex items-center gap-4 mb-4">
              <img
                src={track.album.images[track.album.images.length - 1].url}
                alt={track.name}
                className="w-12 h-12 object-cover rounded"
              />
              <div>
                <h3 className="font-medium">{track.name}</h3>
                <p className="text-sm text-zinc-500">
                  {track.artists.map((a) => a.name).join(", ")}
                </p>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ArtistTopTrackDialog;
