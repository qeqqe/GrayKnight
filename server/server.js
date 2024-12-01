require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
const User = require("./model/User");
const rateLimit = require("express-rate-limit");
const session = require("express-session");
const crypto = require("crypto");
const lastFmService = require("./services/lastfm");
dotenv.config();

console.log("JWT_SECRET length:", process.env.JWT_SECRET?.length);

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is not defined in environment variables!");
  process.exit(1);
}

const JWT_SECRET = process.env.JWT_SECRET;
const app = express();
const port = process.env.PORT || 3001;
const verifyToken = require("./components/authVerifier");
const ConnectDB = require("./components/ConnectDB");
app.use(cors());
app.use(bodyParser.json());

app.use(
  session({
    secret: JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === "production" },
  })
);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
});

ConnectDB();

app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const normalizedEmail = email?.toLowerCase().trim();

    if (!normalizedEmail || !password || !username) {
      return res
        .status(400)
        .json({ message: "Username, email and password are required" });
    }

    if (username.length < 3) {
      return res.status(400).json({
        message: "Username must be at least 3 characters long",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long",
      });
    }

    const [existingUser, existingUsername] = await Promise.all([
      User.findOne({ email: normalizedEmail }),
      User.findOne({ username }),
    ]);

    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    if (existingUsername) {
      return res.status(409).json({ message: "Username already taken" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({
      username,
      email: normalizedEmail,
      password: hashedPassword,
      createdAt: new Date(),
    });

    await user.save();
    return res.status(201).json({
      message: "User successfully created",
      userId: user._id,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({
      message: "An error occurred during registration",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

app.post("/login", loginLimiter, async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    console.log("Creating token with secret length:", JWT_SECRET.length);

    const accessToken = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        username: user.username,
      },
      JWT_SECRET,
      {
        expiresIn: "500h",
        algorithm: "HS256",
      }
    );

    console.log("Token generated successfully, length:", accessToken.length);

    return res.status(200).json({
      accessToken,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      message: "An error occurred during login",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

app.get("/auth/lastfm", (req, res) => {
  try {
    const token = req.query.auth_token;
    console.log("Starting Last.fm auth with token:", token);

    if (!token) {
      throw new Error("No auth token provided");
    }

    const callbackUrl = `${process.env.LASTFM_CALLBACK_URL}?jwt=${token}`;
    console.log("Callback URL:", callbackUrl);

    const authUrl = `http://www.last.fm/api/auth/?api_key=${
      process.env.LASTFM_API_KEY
    }&cb=${encodeURIComponent(callbackUrl)}`;

    res.redirect(authUrl);
  } catch (error) {
    console.error("Auth initialization error:", error);
    res.redirect(`${process.env.CLIENT_URL}/dashboard?error=auth_init_failed`);
  }
});

app.get("/auth/lastfm/callback", async (req, res) => {
  try {
    const { token: lastfmToken, jwt: userToken } = req.query;
    console.log("Callback received with:", { lastfmToken, userToken });

    if (!lastfmToken) {
      throw new Error("No Last.fm token received");
    }
    if (!userToken) {
      throw new Error("No user JWT received");
    }

    const session = await getLastFmSession(lastfmToken);
    const decoded = jwt.verify(userToken, process.env.JWT_SECRET);

    console.log("📍 Saving Last.fm session to DB:", {
      userId: decoded.userId,
      username: session.name,
      sessionKey: session.key,
    });

    await User.findByIdAndUpdate(
      decoded.userId,
      {
        lastfmUsername: session.name,
        lastfmSessionKey: session.key,
        lastfm: {
          username: session.name,
          sessionKey: session.key,
          connectedAt: new Date(),
        },
      },
      { new: true }
    );

    const redirectUrl = new URL(`${process.env.CLIENT_URL}/dashboard`);
    redirectUrl.searchParams.set("lastfm_connected", "true");
    redirectUrl.searchParams.set("sessionKey", session.key);
    redirectUrl.searchParams.set("username", session.name);

    res.redirect(redirectUrl.toString());
  } catch (error) {
    console.error("Last.fm auth error:", error);
    res.redirect(
      `${process.env.CLIENT_URL}/dashboard?error=auth_failed&message=${error.message}`
    );
  }
});

app.post("/api/lastfm/save-session", verifyToken, async (req, res) => {
  try {
    const { sessionKey, username } = req.body;
    console.log("📍 Saving session:", { username, hasKey: !!sessionKey });

    const updateResult = await User.findByIdAndUpdate(
      req.user.userId,
      {
        lastfmUsername: username,
        lastfmSessionKey: sessionKey,
      },
      { new: true }
    );

    console.log("📍 Update result:", {
      success: !!updateResult,
      username: updateResult?.lastfmUsername,
      hasKey: !!updateResult?.lastfmSessionKey,
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error saving Last.fm session:", error);
    res.status(500).json({ message: "Failed to save Last.fm session" });
  }
});

app.get("/api/lastfm/userinfo", async (req, res) => {
  try {
    const username = req.query.username;

    const [userInfo, recentTracks] = await Promise.all([
      fetch(
        `http://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${username}&api_key=${process.env.LASTFM_API_KEY}&format=json`
      ).then((r) => r.json()),

      fetch(
        `http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${username}&api_key=${process.env.LASTFM_API_KEY}&limit=1&format=json`
      ).then((r) => r.json()),
    ]);

    const userData = {
      name: userInfo.user.name,
      url: userInfo.user.url,
      playcount: userInfo.user.playcount,
      country: userInfo.user.country,
      image: userInfo.user.image,
      recentTrack: recentTracks.recenttracks.track[0] || null,
    };

    console.log("Last.fm user data:", userData);
    res.json(userData);
  } catch (error) {
    console.error("Last.fm API error:", error);
    res.status(500).json({ error: "Failed to fetch user info" });
  }
});

app.get("/api/lastfm/topartists", async (req, res) => {
  try {
    console.log("🎸 Fetching top artists from Last.fm...");
    const response = await fetch(
      `http://ws.audioscrobbler.com/2.0/?method=user.gettopartists&api_key=${process.env.LASTFM_API_KEY}&format=json&limit=50`
    );
    const data = await response.json();

    // Send the artist array from the correct path in the response
    res.json(data.topartists.artist || []);
  } catch (error) {
    console.error("🎸 Error fetching top artists:", error);
    res.status(500).json({ error: "Failed to fetch top artists" });
  }
});

app.get("/api/lastfm/now-playing", verifyToken, async (req, res) => {
  console.log("📻 Now Playing endpoint called");

  try {
    const user = await User.findById(req.user.userId);
    const sessionKey = req.headers["x-lastfm-session"];

    console.log("📻 Auth details:", {
      username: user?.lastfmUsername,
      hasSessionKey: !!sessionKey,
    });

    if (!user?.lastfmUsername || !sessionKey) {
      console.log("📻 Missing credentials");
      return res.json({ playing: false });
    }

    const apiUrl = new URL("http://ws.audioscrobbler.com/2.0/");
    apiUrl.searchParams.set("method", "user.getrecenttracks");
    apiUrl.searchParams.set("user", user.lastfmUsername);
    apiUrl.searchParams.set("api_key", process.env.LASTFM_API_KEY);
    apiUrl.searchParams.set("sk", sessionKey);
    apiUrl.searchParams.set("format", "json");
    apiUrl.searchParams.set("limit", "1");
    apiUrl.searchParams.set("extended", "1");

    console.log("📻 Making request to Last.fm...");
    const response = await fetch(apiUrl.toString());
    console.log("📻 Response status:", response.status);

    const data = await response.json();
    if (data.error) {
      throw new Error(`Last.fm API error: ${data.message}`);
    }

    const currentTrack = data.recenttracks?.track?.[0];
    if (!currentTrack) {
      return res.json({ playing: false });
    }

    const isPlaying = !!currentTrack["@attr"]?.nowplaying;
    console.log("📻 Track info:", {
      name: currentTrack.name,
      artist: currentTrack.artist?.name || currentTrack.artist?.["#text"],
      isPlaying,
    });

    return res.json({
      playing: isPlaying,
      track: {
        name: currentTrack.name,
        artist: currentTrack.artist?.name || currentTrack.artist?.["#text"],
        album: currentTrack.album?.["#text"],
        image: currentTrack.image?.[3]?.["#text"],
        url: currentTrack.url,
      },
      timestamp: isPlaying
        ? Date.now()
        : parseInt(currentTrack.date?.uts) * 1000,
    });
  } catch (error) {
    console.error("📻 Error:", error);
    return res.status(500).json({ error: error.message, playing: false });
  }
});

app.get("/api/lastfm/user/top-artists", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user?.lastfmUsername) {
      return res.status(404).json({ error: "User not connected" });
    }
    const period = req.query.period || "7day";
    const response = await fetch(
      `http://ws.audioscrobbler.com/2.0/?method=user.gettopartists&user=${user.lastfmUsername}&api_key=${process.env.LASTFM_API_KEY}&format=json&limit=50&period=${period}`
    );
    const data = await response.json();
    res.json(data.topartists);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch top artists" });
  }
});

app.get("/api/lastfm/user/recent", verifyToken, async (req, res) => {
  console.log("🎵 [Recent Tracks] Endpoint called");
  try {
    const user = await User.findById(req.user.userId);
    const sessionKey = req.headers["x-lastfm-session"]; // This is needed from frontend

    console.log("🎵 [Recent Tracks] Auth details:", {
      username: user?.lastfmUsername,
      hasSessionKey: !!sessionKey,
    });

    if (!user?.lastfmUsername || !sessionKey) {
      console.log("🎵 [Recent Tracks] Missing credentials");
      return res.status(404).json({ error: "User not connected" });
    }

    const { limit = 50, page = 1 } = req.query;

    const apiUrl = new URL("http://ws.audioscrobbler.com/2.0/");
    apiUrl.searchParams.set("method", "user.getrecenttracks");
    apiUrl.searchParams.set("user", user.lastfmUsername);
    apiUrl.searchParams.set("api_key", process.env.LASTFM_API_KEY);
    apiUrl.searchParams.set("sk", sessionKey); // This was missing!
    apiUrl.searchParams.set("format", "json");
    apiUrl.searchParams.set(
      "limit",
      Math.min(Math.max(1, Number(limit)), 200).toString()
    );
    apiUrl.searchParams.set("page", Math.max(1, Number(page)).toString());
    apiUrl.searchParams.set("extended", "1");

    console.log("🎵 [Recent Tracks] Last.fm API URL:", apiUrl.toString());

    const response = await fetch(apiUrl.toString());
    console.log(
      "🎵 [Recent Tracks] Last.fm API response status:",
      response.status
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("🎵 [Recent Tracks] Last.fm API error:", error);
      throw new Error(`Last.fm API error: ${error.message}`);
    }

    const data = await response.json();
    console.log("🎵 [Recent Tracks] Last.fm API response data:", {
      hasData: !!data,
      trackCount: data?.recenttracks?.track?.length,
      metadata: data?.recenttracks?.["@attr"],
    });

    if (data.error) {
      console.error("🎵 [Recent Tracks] Last.fm API returned error:", {
        code: data.error,
        message: data.message,
      });
      throw new Error(`Last.fm API error (${data.error}): ${data.message}`);
    }

    const formattedResponse = {
      tracks: data.recenttracks.track || [],
      meta: {
        page: Number(data.recenttracks["@attr"]?.page || 1),
        perPage: Number(data.recenttracks["@attr"]?.perPage || limit),
        total: Number(data.recenttracks["@attr"]?.total || 0),
        totalPages: Number(data.recenttracks["@attr"]?.totalPages || 1),
        user: data.recenttracks["@attr"]?.user,
      },
    };

    console.log("🎵 [Recent Tracks] Sending response:", {
      trackCount: formattedResponse.tracks.length,
      metadata: formattedResponse.meta,
    });

    res.json(formattedResponse);
  } catch (error) {
    console.error("🎵 [Recent Tracks] Error:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      error: "Failed to fetch recent tracks",
      message: error.message,
    });
  }
});

app.get("/api/lastfm/status", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user?.lastfmUsername) {
      return res.json({ connected: false });
    }

    const userInfo = await fetch(
      `http://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${user.lastfmUsername}&api_key=${process.env.LASTFM_API_KEY}&format=json`
    ).then((r) => r.json());

    return res.json({
      connected: true,
      username: user.lastfmUsername,
      userInfo: userInfo.user,
    });
  } catch (error) {
    console.error("Status check error:", error);
    return res.status(500).json({ connected: false, error: error.message });
  }
});

app.get("/api/lastfm/user/top-tracks", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user?.lastfmUsername) {
      return res.status(404).json({ error: "User not connected" });
    }

    const period = req.query.period || "7day"; // overall, 12month, 6month, 3month, 1month, 7day

    const response = await fetch(
      `http://ws.audioscrobbler.com/2.0/?method=user.gettoptracks&user=${user.lastfmUsername}&api_key=${process.env.LASTFM_API_KEY}&format=json&limit=50&period=${period}`
    );
    const data = await response.json();
    res.json(data.toptracks);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch top tracks" });
  }
});

async function getLastFmSession(token) {
  const params = {
    method: "auth.getSession",
    api_key: process.env.LASTFM_API_KEY,
    token: token,
  };

  const sigString =
    Object.keys(params)
      .sort()
      .map((key) => `${key}${params[key]}`)
      .join("") + process.env.LASTFM_SECRET;

  const apiSig = crypto.createHash("md5").update(sigString).digest("hex");

  const response = await fetch(
    `http://ws.audioscrobbler.com/2.0/?` +
      `method=auth.getSession&` +
      `api_key=${process.env.LASTFM_API_KEY}&` +
      `token=${token}&` +
      `api_sig=${apiSig}&` +
      `format=json`
  );

  const data = await response.json();
  if (!data.session) {
    throw new Error("Failed to get Last.fm session");
  }

  return data.session;
}

app.get("/auth/lastfm/connect", verifyToken, (req, res) => {
  const authUrl = `http://www.last.fm/api/auth/?api_key=${process.env.LASTFM_API_KEY}&cb=${process.env.LASTFM_CALLBACK_URL}`;
  res.json({ authUrl });
});

app.post("/auth/lastfm/callback", verifyToken, async (req, res) => {
  try {
    const { token } = req.body;
    const session = await getLastFmSession(token);

    await User.findByIdAndUpdate(req.user.userId, {
      lastfm: {
        username: session.name,
        sessionKey: session.key,
        connectedAt: new Date(),
      },
    });

    res.json({ success: true, username: session.name });
  } catch (error) {
    console.error("Last.fm callback error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
});

app.get("/auth/lastfm/init", verifyToken, (req, res) => {
  try {
    const authUrl = lastFmService.generateAuthUrl(
      req.headers.authorization.split(" ")[1]
    );
    res.json({ authUrl });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate auth URL" });
  }
});

app.get("/auth/lastfm/callback", async (req, res) => {
  try {
    const { token: lastfmToken, jwt: userToken } = req.query;

    if (!lastfmToken || !userToken) {
      throw new Error("Missing required tokens");
    }

    const decoded = jwt.verify(userToken, process.env.JWT_SECRET);
    const session = await lastFmService.getSession(lastfmToken);

    await lastFmService.saveCredentials(
      decoded.userId,
      session.name,
      session.key
    );

    await User.findByIdAndUpdate(decoded.userId, { lastFmConnected: true });

    const redirectUrl = new URL(`${process.env.CLIENT_URL}/dashboard`);
    redirectUrl.searchParams.set("lastfm_connected", "true");
    res.redirect(redirectUrl.toString());
  } catch (error) {
    console.error("Last.fm callback error:", error);
    res.redirect(`${process.env.CLIENT_URL}/dashboard?error=auth_failed`);
  }
});

app.get("/api/lastfm/now-playing", verifyToken, async (req, res) => {
  try {
    const credentials = await lastFmService.getCredentials(req.user.userId);
    if (!credentials) {
      return res.json({ playing: false });
    }

    const response = await fetch(
      `${lastFmService.API_URL}?method=user.getrecenttracks&user=${credentials.username}&api_key=${lastFmService.API_KEY}&format=json&limit=1`
    );

    const data = await response.json();
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch now playing" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
