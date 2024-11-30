const crypto = require("crypto");
const LastFmCredentials = require("../model/LastFmCredentials");

class LastFmService {
  constructor() {
    this.API_KEY = process.env.LASTFM_API_KEY;
    this.API_SECRET = process.env.LASTFM_SECRET;
    this.API_URL = "http://ws.audioscrobbler.com/2.0/";
  }

  generateAuthUrl(token) {
    const callbackUrl = `${process.env.LASTFM_CALLBACK_URL}?jwt=${token}`;
    return `http://www.last.fm/api/auth/?api_key=${
      this.API_KEY
    }&cb=${encodeURIComponent(callbackUrl)}`;
  }

  async getSession(token) {
    const params = {
      method: "auth.getSession",
      api_key: this.API_KEY,
      token: token,
    };

    const signature = this.generateSignature(params);
    const url = `${this.API_URL}?method=auth.getSession&api_key=${this.API_KEY}&token=${token}&api_sig=${signature}&format=json`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.session) {
      throw new Error("Failed to get Last.fm session");
    }

    return data.session;
  }

  generateSignature(params) {
    const string =
      Object.keys(params)
        .sort()
        .map((key) => `${key}${params[key]}`)
        .join("") + this.API_SECRET;

    return crypto.createHash("md5").update(string).digest("hex");
  }

  async saveCredentials(userId, username, sessionKey) {
    let credentials = await LastFmCredentials.findOne({ userId });

    if (credentials) {
      credentials.username = username;
      credentials.sessionKey = sessionKey;
      credentials.updatedAt = new Date();
    } else {
      credentials = new LastFmCredentials({
        userId,
        username,
        sessionKey,
      });
    }

    await credentials.save();
    return credentials;
  }

  async getCredentials(userId) {
    return await LastFmCredentials.findOne({ userId });
  }

  async getRecentTracks(username) {
    const url = `${this.API_URL}?method=user.getrecenttracks&user=${username}&api_key=${this.API_KEY}&format=json&limit=1`;
    const response = await fetch(url);
    return await response.json();
  }
}

module.exports = new LastFmService();
