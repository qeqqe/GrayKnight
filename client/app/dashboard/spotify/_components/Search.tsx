"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search as SearchIcon,
  Loader2,
  ExternalLink,
  Plus,
  PlayCircle,
} from "lucide-react";
import {
  SEARCH_TYPES,
  SpotifySearchType,
  SpotifySearchResponse,
  SpotifyAlbum,
  SpotifyPlaylistItem,
  spotifyTrack,
} from "../types";
import { searchSpotify, playSpotifyTrack, addToQueue } from "@/lib/spotify";
import { AlbumDialog } from "./AlbumDialog";
import { PlaylistDialog } from "./PlaylistDialog";

export const Search = () => {
  const [query, setQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<SpotifySearchType[]>([
    "track",
  ]);
  const [results, setResults] = useState<SpotifySearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<SpotifyAlbum | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] =
    useState<SpotifyPlaylistItem | null>(null);

  const handleSearch = async () => {
    if (!query.trim() || selectedTypes.length === 0) return;

    setIsLoading(true);
    try {
      const searchResults = await searchSpotify(query, selectedTypes);
      setResults(searchResults);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTypeToggle = (type: SpotifySearchType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handlePlay = async (track: spotifyTrack) => {
    try {
      if (track.album) {
        await playSpotifyTrack({
          context_uri: `spotify:album:${track.album.id}`,
          offset: { uri: track.uri },
        });
      } else {
        await playSpotifyTrack({ uris: [track.uri] });
      }
    } catch (error) {
      console.error("Failed to play track:", error);
    }
  };

  const handleAddToQueue = async (uri: string) => {
    try {
      await addToQueue(uri);
    } catch (error) {
      console.error("Failed to add to queue:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <SearchIcon className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {SEARCH_TYPES.map((type) => (
            <label
              key={type}
              className="flex items-center space-x-2 bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full"
            >
              <Checkbox
                checked={selectedTypes.includes(type)}
                onCheckedChange={() => handleTypeToggle(type)}
                id={type}
              />
              <span className="text-sm capitalize">{type}</span>
            </label>
          ))}
        </div>
      </div>

      {results && (
        <ScrollArea className="h-[600px] rounded-md border p-4">
          <div className="space-y-8">
            {results.tracks && results.tracks.items.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Tracks</h3>
                <div className="grid gap-4">
                  {results.tracks.items.map((track) => (
                    <div
                      key={track.id}
                      className="flex items-center gap-3 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
                    >
                      <img
                        src={track.album.images[2]?.url}
                        alt={track.album.name}
                        className="w-10 h-10 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{track.name}</p>
                        <p className="text-sm text-zinc-500 truncate">
                          {track.artists.map((a) => a.name).join(", ")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handlePlay(track)}
                        >
                          <PlayCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleAddToQueue(track.uri)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.artists && results.artists.items.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Artists</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {results.artists.items.map((artist) => (
                    <a
                      key={artist.id}
                      href={artist.external_urls.spotify}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group p-4 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      <img
                        src={
                          artist.images?.[0]?.url || "/artist-placeholder.png"
                        }
                        alt={artist.name}
                        className="w-full aspect-square object-cover rounded-full mb-3"
                      />
                      <p className="font-medium text-center truncate">
                        {artist.name}
                      </p>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {results.albums && results.albums.items.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Albums</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {results.albums.items.map((album) => (
                    <div
                      key={album.id}
                      className="group p-4 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                      onClick={() => setSelectedAlbum(album)}
                    >
                      <img
                        src={album.images[0]?.url}
                        alt={album.name}
                        className="w-full aspect-square object-cover rounded-lg mb-3"
                      />
                      <p className="font-medium truncate">{album.name}</p>
                      <p className="text-sm text-zinc-500 truncate">
                        {album.artists.map((a) => a.name).join(", ")}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results?.playlists &&
              Array.isArray(results.playlists.items) &&
              results.playlists.items.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Playlists</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {results.playlists.items.map((playlist) => {
                      if (!playlist) return null;

                      const imageUrl =
                        playlist.images?.[0]?.url ??
                        "/playlist-placeholder.png";
                      const name = playlist.name ?? "Untitled Playlist";
                      const ownerName =
                        playlist.owner?.display_name ?? "Unknown";

                      return (
                        <div
                          key={playlist.id}
                          className="group p-4 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                          onClick={() => setSelectedPlaylist(playlist)}
                        >
                          <img
                            src={imageUrl}
                            alt={name}
                            className="w-full aspect-square object-cover rounded-lg mb-3"
                          />
                          <p className="font-medium truncate">{name}</p>
                          <p className="text-sm text-zinc-500 truncate">
                            By {ownerName}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            {results.shows && results.shows.items.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Shows</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {results.shows.items.map((show) => (
                    <div
                      key={show.id}
                      className="group p-4 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      <img
                        src={show.images[0]?.url}
                        alt={show.name}
                        className="w-full aspect-square object-cover rounded-lg mb-3"
                      />
                      <p className="font-medium truncate">{show.name}</p>
                      <p className="text-sm text-zinc-500 truncate">
                        {show.publisher}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      )}

      <AlbumDialog
        album={selectedAlbum}
        isOpen={!!selectedAlbum}
        onOpenChange={(open) => !open && setSelectedAlbum(null)}
      />
      <PlaylistDialog
        playlist={selectedPlaylist}
        isOpen={!!selectedPlaylist}
        onOpenChange={(open) => !open && setSelectedPlaylist(null)}
      />
    </div>
  );
};
