import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  CircleDot,
  Clock,
  Disc,
  Flame,
  Heart,
  ListMusic,
  Music2,
  Radio,
  Star,
  TrendingUp,
} from "lucide-react";

interface ListeningStats {
  totalTracks: number;
  totalMinutes: number;
  uniqueArtists: number;
  repeatRate: number;
  genres: { name: string; percentage: number }[];
  timeDistribution: { [key: string]: number };
  weeklyActivity: number[];
  insights: {
    mostActiveTime: string;
    favoriteGenre: string;
    dailyAverage: string;
  };
}

const MoreData = () => {
  const [stats, setStats] = useState<ListeningStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchListeningStats = async () => {
      try {
        const token = localStorage.getItem("spotify_access_token");

        // Fetch recently played tracks for time distribution
        const recentlyPlayedRes = await fetch(
          "https://api.spotify.com/v1/me/player/recently-played?limit=50",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const recentlyPlayed = await recentlyPlayedRes.json();

        // Fetch top tracks
        const topTracksRes = await fetch(
          "https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=short_term",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const topTracks = await topTracksRes.json();

        // Fetch top artists
        const topArtistsRes = await fetch(
          "https://api.spotify.com/v1/me/top/artists?limit=50&time_range=short_term",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const topArtists = await topArtistsRes.json();

        // Process the data
        const timeDistribution = calculateTimeDistribution(
          recentlyPlayed.items
        );
        const genres = extractTopGenres(topArtists.items);
        const weeklyActivity = calculateWeeklyActivity(recentlyPlayed.items);
        const uniqueArtistsCount = new Set(
          topTracks.items.map((t: any) => t.artists[0].id)
        ).size;
        const repeatRate = calculateRepeatRate(recentlyPlayed.items);

        setStats({
          totalTracks: topTracks.total || 0,
          totalMinutes: calculateTotalMinutes(recentlyPlayed.items),
          uniqueArtists: uniqueArtistsCount,
          repeatRate,
          genres,
          timeDistribution,
          weeklyActivity,
          insights: {
            mostActiveTime: getMostActiveTime(timeDistribution),
            favoriteGenre: genres[0]?.name || "N/A",
            dailyAverage: calculateDailyAverage(recentlyPlayed.items),
          },
        });
      } catch (error) {
        console.error("Failed to fetch listening stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchListeningStats();
  }, []);

  if (loading) {
    return <div>Loading stats...</div>;
  }

  if (!stats) {
    return <div>No stats available</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Music2 className="w-4 h-4" />}
          title="Total Tracks"
          value={stats.totalTracks.toLocaleString()}
        />
        <StatCard
          icon={<Clock className="w-4 h-4" />}
          title="Minutes Listened"
          value={stats.totalMinutes.toLocaleString()}
        />
        <StatCard
          icon={<CircleDot className="w-4 h-4" />}
          title="Unique Artists"
          value={stats.uniqueArtists.toLocaleString()}
        />
        <StatCard
          icon={<TrendingUp className="w-4 h-4" />}
          title="Repeat Rate"
          value={`${stats.repeatRate}%`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Genre Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Radio className="w-5 h-5" />
              Genre Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.genres.map((genre) => (
                <div key={genre.name}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">{genre.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {genre.percentage}%
                    </span>
                  </div>
                  <Progress value={genre.percentage} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Rest of the cards with real data... */}
        {/* ...existing card components using stats data... */}
      </div>
    </div>
  );
};

// Helper functions to process the data
const calculateTimeDistribution = (tracks: any[]) => {
  const distribution: { [key: string]: number } = {
    morning: 0,
    afternoon: 0,
    evening: 0,
    night: 0,
  };

  tracks.forEach((track) => {
    const hour = new Date(track.played_at).getHours();
    if (hour >= 5 && hour < 12) distribution.morning++;
    else if (hour >= 12 && hour < 17) distribution.afternoon++;
    else if (hour >= 17 && hour < 22) distribution.evening++;
    else distribution.night++;
  });

  const total = Object.values(distribution).reduce((a, b) => a + b, 0);
  Object.keys(distribution).forEach((key) => {
    distribution[key] = Math.round((distribution[key] / total) * 100);
  });

  return distribution;
};

const extractTopGenres = (artists: any[]) => {
  const genreCounts: { [key: string]: number } = {};
  artists.forEach((artist) => {
    artist.genres.forEach((genre: string) => {
      genreCounts[genre] = (genreCounts[genre] || 0) + 1;
    });
  });

  return Object.entries(genreCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, count]) => ({
      name,
      percentage: Math.round((count / artists.length) * 100),
    }));
};

const calculateWeeklyActivity = (tracks: any[]) => {
  const weekDays = new Array(7).fill(0);
  tracks.forEach((track) => {
    const day = new Date(track.played_at).getDay();
    weekDays[day]++;
  });

  const max = Math.max(...weekDays);
  return weekDays.map((count) => Math.round((count / max) * 100));
};

const calculateRepeatRate = (tracks: any[]) => {
  const trackIds = tracks.map((t) => t.track.id);
  const uniqueTracks = new Set(trackIds);
  return Math.round(
    ((trackIds.length - uniqueTracks.size) / trackIds.length) * 100
  );
};

const calculateTotalMinutes = (tracks: any[]) => {
  return tracks.reduce(
    (total, track) => total + track.track.duration_ms / 60000,
    0
  );
};

const getMostActiveTime = (distribution: { [key: string]: number }) => {
  return Object.entries(distribution).sort(([, a], [, b]) => b - a)[0][0];
};

const calculateDailyAverage = (tracks: any[]) => {
  const totalHours = tracks.reduce(
    (total, track) => total + track.track.duration_ms / (1000 * 60 * 60),
    0
  );
  return `${(totalHours / 7).toFixed(1)} hours`;
};

const StatCard = ({ icon, title, value }: any) => (
  <Card>
    <CardContent className="pt-4">
      <div className="flex items-center gap-2">
        {icon}
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

const InsightItem = ({ icon, title, value }: any) => (
  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
    <div className="p-2 rounded-full bg-primary/10">{icon}</div>
    <div>
      <p className="font-medium">{title}</p>
      <p className="text-sm text-muted-foreground">{value}</p>
    </div>
  </div>
);

export default MoreData;
