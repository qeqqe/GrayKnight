export async function playSpotifyTrack(options: {
  uri?: string;
  context_uri?: string;
  uris?: string[];
  position_ms?: number;
  deviceId?: string;
  offset?: {
    uri?: string;
    position?: number;
  };
}) {
  const token = localStorage.getItem("spotify_access_token");
  if (!token) throw new Error("No Spotify access token found");

  const endpoint = `https://api.spotify.com/v1/me/player/play${
    options.deviceId ? `?device_id=${options.deviceId}` : ""
  }`;

  const body: any = {};
  if (options.context_uri) body.context_uri = options.context_uri;
  if (options.uris) body.uris = options.uris;
  if (options.position_ms) body.position_ms = options.position_ms;
  if (options.offset) body.offset = options.offset;

  try {
    const response = await fetch(endpoint, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error.message || "Failed to play track");
    }
  } catch (error) {
    console.error("Failed to play track:", error);
    throw error;
  }
}

export const pauseSpotifyTrack = async (deviceId?: string) => {
  const token = localStorage.getItem("spotify_access_token");
  const endpoint = deviceId
    ? `https://api.spotify.com/v1/me/player/pause?device_id=${deviceId}`
    : "https://api.spotify.com/v1/me/player/pause";

  const response = await fetch(endpoint, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to pause track");
  }
};

export const nextSpotifyTrack = async (deviceId?: string) => {
  const token = localStorage.getItem("spotify_access_token");
  const endpoint = deviceId
    ? `https://api.spotify.com/v1/me/player/next?device_id=${deviceId}`
    : "https://api.spotify.com/v1/me/player/next";

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to skip to next track");
  }
};

export const previousSpotifyTrack = async (deviceId?: string) => {
  const token = localStorage.getItem("spotify_access_token");
  const endpoint = deviceId
    ? `https://api.spotify.com/v1/me/player/previous?device_id=${deviceId}`
    : "https://api.spotify.com/v1/me/player/previous";

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to go to previous track");
  }
};
