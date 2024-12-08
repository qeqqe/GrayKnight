import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Music2 } from "lucide-react";
import { SpotifyPlaylistItem } from "../types";

interface PlaylistSectionProps {
  playlists: SpotifyPlaylistItem[];
  onSelect: (id: string) => void;
}

export const PlaylistSection = ({
  playlists,
  onSelect,
}: PlaylistSectionProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Playlists</CardTitle>
        <CardDescription>
          Manage and play your Spotify playlists
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {playlists.map((playlist) => (
            <div
              key={playlist.id}
              className="flex items-center gap-4 py-4 border-b cursor-pointer hover:bg-zinc-100/80 dark:hover:bg-zinc-800/50 rounded-md transition-colors p-2"
              onClick={() => onSelect(playlist.id)}
            >
              <Avatar className="h-12 w-12">
                <AvatarImage
                  src={playlist.images[0]?.url}
                  alt={playlist.name}
                />
                <AvatarFallback>
                  <Music2 className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">{playlist.name}</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {playlist.tracks.total} tracks • By{" "}
                  {playlist.owner.display_name}
                </p>
              </div>
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
