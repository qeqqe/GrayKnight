import React, { useEffect, useState } from "react";
import { fetchTopItems } from "@/lib/spotify";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface ArtistProps {
  items: Item[];
  total: number;
  limit: number;
  offset: number;
  href: string;
  next: string;
  previous: null;
}

interface Item {
  external_urls: Externalurls;
  followers: Followers;
  genres: string[];
  href: string;
  id: string;
  images: Image[];
  name: string;
  popularity: number;
  type: string;
  uri: string;
}

interface Image {
  height: number;
  url: string;
  width: number;
}

interface Followers {
  href: null;
  total: number;
}

interface Externalurls {
  spotify: string;
}

const TopArtists = () => {
  const [artistsPeriod, setArtistsPeriod] = useState<
    "short_term" | "medium_term" | "long_term"
  >("short_term");
  const [artists, setArtists] = useState<ArtistProps | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await fetchTopItems("artists", artistsPeriod);
        setArtists(data);
      } catch (error) {
        console.error("Error fetching artists:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [artistsPeriod]);
  const loadMore = async () => {
    if (!artists?.next) return;
    const response = await fetch(artists.next, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("spotify_access_token")}`,
      },
    });
    const data = await response.json();
    setArtists((prev) => ({
      ...data,
      items: [...(prev?.items ?? []), ...data.items],
    }));
  };
  return (
    <div className="p-4">
      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Top Artists</CardTitle>
              <CardDescription>Your top artists</CardDescription>
            </div>

            <select
              value={artistsPeriod}
              onChange={(e) =>
                setArtistsPeriod(
                  e.target.value as "short_term" | "medium_term" | "long_term"
                )
              }
              className="p-2 rounded-md border bg-background"
            >
              <option value="short_term">Last Month</option>
              <option value="medium_term">Last 6 Months</option>
              <option value="long_term">Last Year</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                Loading...
              </div>
            ) : (
              artists?.items.map((artist) => (
                <div
                  key={artist.id}
                  className="flex items-center space-x-4 mb-4"
                >
                  <Avatar>
                    <AvatarImage
                      src={artist.images?.[0]?.url || ""}
                      alt={artist.name}
                    />
                    <AvatarFallback>{artist.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <a
                      href={artist.external_urls.spotify}
                      target="_blank"
                      rel="noreferrer"
                      className="text-lg font-semibold"
                    >
                      {artist.name}
                    </a>
                    <p className="text-sm text-gray-500">
                      {artist.genres?.slice(0, 3)?.join(", ") ||
                        "No genres available"}
                    </p>
                  </div>
                </div>
              ))
            )}
            <Button variant={"ghost"} onClick={loadMore}>
              Load more
            </Button>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default TopArtists;
