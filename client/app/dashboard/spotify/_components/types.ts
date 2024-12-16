export interface SpotifyTrack {
  track: {
    id: string;
    name: string;
    duration_ms: number;
    artists: Array<{ id: string; name: string }>;
    album: {
      images: Array<{ url: string }>;
    };
  };
  played_at: string;
}

export interface ListeningStats {
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
