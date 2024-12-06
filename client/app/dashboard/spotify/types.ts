export interface spotifyTrack {
  id: string;
  name: string;
  duration_ms: number;
  explicit: boolean;
  artists: {
    external_urls: {
      spotify: string;
    };
    href: string;
    id: string;
    name: string;
    type: string;
    uri: string;
  }[];
  album: {
    album_type: string;
    name: string;
    images: {
      url: string;
      height?: number;
      width?: number;
    }[];
    external_urls: {
      spotify: string;
    };
    release_date: string;
    release_date_precision: "year" | "month" | "day";
  };
  preview_url: string | null;
  popularity?: number;
  progress_ms: number;
  is_playing: boolean;
}

export interface spotifyData {
  display_name: string;
  country: string;
  email: string;
  id: string;
  uri: string;
}

export interface spotifyOtherData {
  followers: {
    total: number;
  };
  images: {
    url: string;
    height: number;
    width: number;
  }[];
}

export interface SpotifyPlaylist {
  href: string;
  limit: number;
  next: string;
  offset: number;
  previous: string;
  total: number;
  items: SpotifyPlaylistItem[];
}

export interface SpotifyPlaylistItem {
  collaborative: boolean;
  description: string;
  external_urls: {
    spotify: string;
  };
  href: string;
  id: string;
  images: SpotifyImage[];
  name: string;
  owner: {
    display_name: string;
    external_urls: {
      spotify: string;
    };
    href: string;
    id: string;
    type: string;
    uri: string;
  };
  primary_color: string | null;
  public: boolean;
  snapshot_id: string;
  tracks: {
    href: string;
    total: number;
  };
  type: string;
  uri: string;
}

export interface SpotifyImage {
  height: number | null;
  url: string;
  width: number | null;
}

export interface SpotifyPlaylistTrack {
  track: {
    id: string;
    name: string;
    duration_ms: number;
    explicit: boolean;
    artists: {
      name: string;
    }[];
    album: {
      name: string;
      images: SpotifyImage[];
    };
    external_urls: {
      spotify: string;
    };
  };
  added_at: string;
}

export interface PlaylistResponse {
  items: SpotifyPlaylistTrack[];
  next: string | null;
  total: number;
}

export interface SpotifyQueue {
  currently_playing: spotifyTrack | null;
  queue: spotifyTrack[];
}

export interface RecentlyPlayedResponse {
  items: RecentlyPlayedItem[];
  next: string | null;
  cursors: {
    after: string;
    before: string;
  };
  limit: number;
}

export interface SpotifyRecentlyPlayedResponse {
  items: RecentlyPlayedItem[];
  next: string | null;
  cursors: {
    after: string;
    before: string;
  };
  limit: number;
  href: string;
}

export interface RecentlyPlayedItem {
  track: {
    album: {
      album_type: string;
      artists: Artist[];
      images: AlbumImage[];
      name: string;
      release_date: string;
      external_urls: {
        spotify: string;
      };
    };
    artists: Artist[];
    duration_ms: number;
    explicit: boolean;
    external_urls: {
      spotify: string;
    };
    id: string;
    name: string;
    popularity: number;
    preview_url: string | null;
  };
  played_at: string;
  context: {
    type: string;
    external_urls: {
      spotify: string;
    };
    uri: string;
  };
}

export interface Artist {
  external_urls: {
    spotify: string;
  };
  name: string;
}

export interface AlbumImage {
  height: number;
  url: string;
  width: number;
}

export interface SpotifyDevice {
  id: string;
  is_active: boolean;
  is_private_session: boolean;
  is_restricted: boolean;
  name: string;
  type: string;
  volume_percent: number;
  supports_volume: boolean;
}

export interface SpotifyDevicesResponse {
  devices: SpotifyDevice[];
}
