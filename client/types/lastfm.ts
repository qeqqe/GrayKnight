export interface Track {
  name: string;
  artist: {
    "#text": string;
    name?: string;
  };
  image: Array<{
    "#text": string;
    size: string;
  }>;
}

export interface LastFmProfile {
  name: string;
  playcount: string;
  image: Array<{
    "#text": string;
    size: string;
  }>;
}

export interface MusicProfile {
  lastfm: LastFmProfile;
  recentTracks: {
    track: Track[];
  };
}

export interface Artist {
  name: string;
  playcount: string;
  listeners?: string;
  mbid: string;
  url: string;
  streamable: string;
  image: Array<{
    "#text": string;
    size: "small" | "medium" | "large" | "extralarge" | "mega";
  }>;
  "@attr"?: {
    rank: string;
  };
}

export interface UserTopTrack {
  name: string;
  duration: string;
  playcount: string;
  artist: {
    name: string;
    "#text"?: string;
  };
  image: Array<{
    "#text": string;
    size: string;
  }>;
}

export interface RecentTrack {
  name: string;
  artist: {
    "#text": string;
    name?: string;
  };
  album: {
    "#text": string;
  };
  image: Array<{
    "#text": string;
    size: string;
  }>;
  "@attr"?: {
    nowplaying: boolean;
  };
  date?: {
    uts: string;
  };
}

export interface CurrentTrack {
  playing: boolean;
  track: {
    name: string;
    artist: string;
    album: string;
    image?: string;
    userPlaycount?: number;
    tags?: Array<{ name: string }>;
  };
  timestamp?: number;
}

export interface RecentTracksResponse {
  tracks: RecentTrack[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
    user: string;
  };
}
