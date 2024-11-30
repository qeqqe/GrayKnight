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
  const token = req.query.auth_token;
  const callbackUrl = `${process.env.LASTFM_CALLBACK_URL}?jwt=${token}`;

  const authUrl = `http://www.last.fm/api/auth/?api_key=${
    process.env.LASTFM_API_KEY
  }&cb=${encodeURIComponent(callbackUrl)}`;
  res.redirect(authUrl);
});

app.get("/auth/lastfm/callback", async (req, res) => {
  try {
    const { token: lastfmToken, jwt: userToken } = req.query;

    if (!lastfmToken || !userToken) {
      throw new Error("Missing tokens");
    }

    const params = {
      method: "auth.getSession",
      api_key: process.env.LASTFM_API_KEY,
      token: lastfmToken,
    };

    const sigString =
      Object.keys(params)
        .sort()
        .map((key) => `${key}${params[key]}`)
        .join("") + process.env.LASTFM_SECRET;

    const apiSig = crypto.createHash("md5").update(sigString).digest("hex");

    const response = await fetch(
      `http://ws.audioscrobbler.com/2.0/?method=auth.getSession&api_key=${process.env.LASTFM_API_KEY}&token=${lastfmToken}&api_sig=${apiSig}&format=json`
    );

    const data = await response.json();

    if (!data.session) {
      throw new Error("Failed to get Last.fm session");
    }

    const decoded = jwt.verify(userToken, process.env.JWT_SECRET);
    await User.findByIdAndUpdate(decoded.userId, {
      lastfmUsername: data.session.name,
      lastfmKey: data.session.key,
    });

    res.redirect(
      `${process.env.CLIENT_URL}/dashboard?` +
        `lastfm_connected=true&` +
        `username=${encodeURIComponent(data.session.name)}&` +
        `key=${encodeURIComponent(data.session.key)}`
    );
  } catch (error) {
    console.error("Last.fm auth error:", error);
    res.redirect(`${process.env.CLIENT_URL}/dashboard?error=auth_failed`);
  }
});

app.post("/api/lastfm/save-session", verifyToken, async (req, res) => {
  try {
    const { sessionKey } = req.body;
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.tokens) user.tokens = [];
    user.tokens.push({
      type: "lastfm",
      key: sessionKey,
    });
    user.lastfm = sessionKey;

    await user.save();
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
    const response = await fetch(
      `http://ws.audioscrobbler.com/2.0/?method=chart.gettopartists&api_key=${process.env.LASTFM_API_KEY}&format=json&limit=50`
    );
    const data = await response.json();

    console.log("Last.fm top artists response:", data);

    res.json(data.artists);
  } catch (error) {
    console.error("Error fetching top artists:", error);
    res.status(500).json({ error: "Failed to fetch top artists" });
  }
});

app.get("/api/lastfm/now-playing", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || !user.tokens?.lastfm?.username) {
      return res.json({ playing: false });
    }

    const lastfm = user.tokens.lastfm;
    console.log("Fetching now playing for user:", lastfm.username);

    const apiUrl = `http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${lastfm.username}&api_key=${process.env.LASTFM_API_KEY}&format=json&limit=1`;
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!data.recenttracks?.track?.length) {
      return res.json({ playing: false });
    }

    const currentTrack = data.recenttracks.track[0];
    const isPlaying = !!currentTrack["@attr"]?.nowplaying;

    return res.json({
      playing: isPlaying,
      track: {
        name: currentTrack.name,
        artist: currentTrack.artist["#text"],
        album: currentTrack.album["#text"],
        image: currentTrack.image?.[2]?.["#text"],
        url: currentTrack.url,
      },
      timestamp: isPlaying ? Date.now() : currentTrack.date?.uts * 1000,
    });
  } catch (error) {
    console.error("Error fetching now playing:", error);
    return res.status(500).json({ error: "Failed to fetch now playing" });
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

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
