import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Music2, Clock, CircleDot, TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { SpotifyTrack, ListeningStats } from "./types";

const MoreData = () => {
  const [stats, setStats] = useState<ListeningStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchListeningStats = async () => {
      try {
        const token = localStorage.getItem("spotify_access_token");

        let allRecentTracks: SpotifyTrack[] = [];
        const requestsNeeded = 6;

        for (let i = 0; i < requestsNeeded; i++) {
          const res = await fetch(
            `https://api.spotify.com/v1/me/player/recently-played?limit=50${
              i > 0
                ? `&before=${
                    allRecentTracks[allRecentTracks.length - 1].played_at
                  }`
                : ""
            }`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          const data = await res.json();
          if (!data.items?.length) break;
          allRecentTracks = [...allRecentTracks, ...data.items];
        }

        const topTracksRes = await fetch(
          "https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=short_term",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const topTracks = await topTracksRes.json();

        const topArtistsRes = await fetch(
          "https://api.spotify.com/v1/me/top/artists?limit=50&time_range=short_term",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const topArtists = await topArtistsRes.json();

        const timeDistribution = calculateTimeDistribution(allRecentTracks);
        const genres = extractTopGenres(topArtists.items);
        const weeklyActivity = calculateWeeklyActivity(allRecentTracks);
        const uniqueArtistsCount = new Set(
          topTracks.items.map((t: any) => t.artists[0].id)
        ).size;
        const repeatRate = calculateRepeatRate(allRecentTracks);

        setStats({
          totalTracks: topTracks.total || 0,
          totalMinutes: calculateTotalMinutes(allRecentTracks),
          uniqueArtists: uniqueArtistsCount,
          repeatRate,
          genres,
          timeDistribution,
          weeklyActivity,
          insights: {
            mostActiveTime: getMostActiveTime(timeDistribution),
            favoriteGenre: genres[0]?.name || "N/A",
            dailyAverage: calculateDailyAverage(allRecentTracks),
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

  const formatTimeDistributionForPieChart = (distribution: {
    [key: string]: number;
  }) => {
    return Object.entries(distribution).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: value,
    }));
  };

  if (loading) return <div>Loading stats...</div>;
  if (!stats) return <div>No stats available</div>;

  const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#6366f1"];

  const customGradientId = "customGradient";
  const customGradient = (
    <defs>
      <linearGradient id={customGradientId} x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
        <stop offset="95%" stopColor="#22c55e" stopOpacity={0.2} />
      </linearGradient>
    </defs>
  );

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
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
            <CardTitle>Weekly Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={stats.weeklyActivity.map((value, index) => ({
                    day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
                      index
                    ],
                    value,
                  }))}
                  margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                >
                  {customGradient}
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#888888" }}
                  />
                  <YAxis
                    domain={[0, "auto"]}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#888888" }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(0, 0, 0, 0.8)",
                      border: "none",
                      borderRadius: "8px",
                      padding: "12px",
                    }}
                    formatter={(value) => [`${value} tracks`, "Tracks Played"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#22c55e"
                    fill={`url(#${customGradientId})`}
                    strokeWidth={2}
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
            <CardTitle>Genre Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={stats.genres}
                  margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                  {customGradient}
                  <XAxis
                    type="number"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#888888" }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={100}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#888888" }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(0, 0, 0, 0.8)",
                      border: "none",
                      borderRadius: "8px",
                      padding: "12px",
                    }}
                    cursor={{ fill: "rgba(255, 255, 255, 0.1)" }}
                  />
                  <Bar
                    dataKey="percentage"
                    fill={`url(#${customGradientId})`}
                    radius={[0, 4, 4, 0]}
                    animationDuration={1500}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
            <CardTitle>Listening Time Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={formatTimeDistributionForPieChart(
                      stats.timeDistribution
                    )}
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={8}
                    dataKey="value"
                    nameKey="name"
                    label={({
                      cx,
                      cy,
                      midAngle,
                      innerRadius,
                      outerRadius,
                      value,
                      name,
                    }) => {
                      const RADIAN = Math.PI / 180;
                      const radius =
                        25 + innerRadius + (outerRadius - innerRadius);
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);
                      return (
                        <text
                          x={x}
                          y={y}
                          textAnchor={x > cx ? "start" : "end"}
                          dominantBaseline="central"
                          fill="#888888"
                          fontSize={12}
                        >
                          {`${name} (${value}%)`}
                        </text>
                      );
                    }}
                    animationDuration={1500}
                  >
                    {formatTimeDistributionForPieChart(
                      stats.timeDistribution
                    ).map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        stroke="none"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "rgba(0, 0, 0, 0.8)",
                      border: "none",
                      borderRadius: "8px",
                      padding: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const calculateTimeDistribution = (tracks: SpotifyTrack[]) => {
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

const calculateWeeklyActivity = (tracks: SpotifyTrack[]) => {
  const weekDays = new Array(7).fill(0);
  tracks.forEach((track) => {
    const day = new Date(track.played_at).getDay();
    weekDays[day]++;
  });
  return weekDays;
};

const calculateRepeatRate = (tracks: SpotifyTrack[]) => {
  const trackIds = tracks.map((t) => t.track.id);
  const uniqueTracks = new Set(trackIds);
  return Math.round(
    ((trackIds.length - uniqueTracks.size) / trackIds.length) * 100
  );
};

const calculateTotalMinutes = (tracks: SpotifyTrack[]) => {
  return tracks.reduce(
    (total, track) => total + track.track.duration_ms / 60000,
    0
  );
};

const getMostActiveTime = (distribution: { [key: string]: number }) => {
  return Object.entries(distribution).sort(([, a], [, b]) => b - a)[0][0];
};

const calculateDailyAverage = (tracks: SpotifyTrack[]) => {
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
