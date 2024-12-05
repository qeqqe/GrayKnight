export class SpotifyTokenManager {
  private static isRefreshing = false;
  private static refreshPromise: Promise<boolean> | null = null;

  static async getValidToken(): Promise<string | null> {
    const accessToken = localStorage.getItem("spotify_access_token");
    const expiry = localStorage.getItem("spotify_token_expiry");
    const refreshToken = localStorage.getItem("spotify_refresh_token");

    if (!accessToken || !expiry || !refreshToken) {
      console.log("Missing token components");
      return null;
    }

    const timeUntilExpiry = parseInt(expiry) - Date.now();

    // Only refresh if token is expired or will expire in 1 minute
    if (timeUntilExpiry < 60000) {
      console.log("Token expired or expiring very soon, refreshing");
      const success = await this.refreshToken();
      return success ? localStorage.getItem("spotify_access_token") : null;
    }

    // Simple validation - we trust the token if it's not expired
    return accessToken;
  }

  static async validateToken(token: string): Promise<boolean> {
    try {
      const response = await fetch("https://api.spotify.com/v1/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  static async refreshToken(): Promise<boolean> {
    if (this.isRefreshing) {
      return this.refreshPromise || Promise.resolve(false);
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        const refreshToken = localStorage.getItem("spotify_refresh_token");
        const token = localStorage.getItem("token");

        if (!refreshToken || !token) {
          throw new Error("No refresh token available");
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/spotify/refresh`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ refresh_token: refreshToken }),
          }
        );

        if (!response.ok) throw new Error("Refresh failed");

        const data = await response.json();

        // Add more precise expiry calculation
        const expiryTime = Date.now() + data.expires_in * 1000;

        localStorage.setItem("spotify_access_token", data.access_token);
        localStorage.setItem("spotify_token_expiry", expiryTime.toString());

        console.log("Token refreshed successfully:", {
          newExpiryTime: new Date(expiryTime).toISOString(),
          expiresIn: data.expires_in,
        });

        return true;
      } catch (error) {
        console.error("Token refresh failed:", error);
        this.clearTokens();
        return false;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  static clearTokens() {
    console.log("Clearing all Spotify tokens");
    localStorage.removeItem("spotify_access_token");
    localStorage.removeItem("spotify_refresh_token");
    localStorage.removeItem("spotify_token_expiry");
  }

  static async fetchWithToken(url: string): Promise<any> {
    const maxRetries = 2;
    let attempts = 0;

    while (attempts < maxRetries) {
      const token = await this.getValidToken();
      if (!token) throw new Error("No valid token available");

      try {
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          return response.json();
        }

        if (response.status === 401) {
          // Clear tokens on unauthorized and try refresh
          this.clearTokens();
          const success = await this.refreshToken();
          if (!success && attempts === maxRetries - 1) {
            throw new Error("Token refresh failed");
          }
          attempts++;
          continue;
        }

        throw new Error(`Request failed: ${response.statusText}`);
      } catch (error) {
        if (attempts === maxRetries - 1) throw error;
        attempts++;
      }
    }
  }
}
