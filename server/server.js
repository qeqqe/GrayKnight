require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
const User = require("./model/User");
const rateLimit = require("express-rate-limit");
const passport = require("./components/FMoauth");
const session = require("express-session");
const crypto = require("crypto");
dotenv.config();

// Debug log for JWT_SECRET
console.log("JWT_SECRET length:", process.env.JWT_SECRET?.length);

// Make sure JWT_SECRET is loaded properly
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
app.use(passport.initialize());

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

    // Debug log before token generation
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
        algorithm: "HS256", // Explicitly set algorithm
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

// Simplified Last.fm routes
app.get("/auth/lastfm", (req, res) => {
  // Direct Last.fm auth - as simple as possible
  const authUrl = `http://www.last.fm/api/auth/?api_key=${process.env.LASTFM_API_KEY}&cb=${process.env.LASTFM_CALLBACK_URL}`;
  res.redirect(authUrl);
});

app.get("/auth/lastfm/callback", async (req, res) => {
  const token = req.query.token;
  console.log("Last.fm callback params:", req.query);

  try {
    // Generate API signature
    const params = {
      api_key: process.env.LASTFM_API_KEY,
      method: "auth.getSession",
      token: token,
    };

    // Sort params alphabetically
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = params[key];
        return acc;
      }, {});

    // Create signature string
    let sigString = "";
    Object.keys(sortedParams).forEach((key) => {
      sigString += key + params[key];
    });
    sigString += process.env.LASTFM_SECRET;

    // Create MD5 hash
    const apiSig = crypto.createHash("md5").update(sigString).digest("hex");

    // Make API request with signature
    const response = await fetch(
      `http://ws.audioscrobbler.com/2.0/?method=auth.getSession&api_key=${process.env.LASTFM_API_KEY}&token=${token}&api_sig=${apiSig}&format=json`
    );

    const data = await response.json();
    console.log("Last.fm session data:", data);

    if (data.session) {
      // Store session info in database here later
      console.log("Got Last.fm session key:", data.session.key);
      console.log("Got Last.fm username:", data.session.name);
    }

    res.redirect(`${process.env.CLIENT_URL}/dashboard`);
  } catch (error) {
    console.error("Error getting Last.fm session:", error);
    res.redirect(`${process.env.CLIENT_URL}/dashboard?error=session_failed`);
  }
});

app.get("/api/lastfm/status", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ connected: false });
    }

    const lastfmToken = user.tokens.find((t) => t.type === "lastfm");
    if (!lastfmToken) {
      return res.json({ connected: false });
    }

    // Get Last.fm user info
    const lastfmInfo = await fetch(
      `http://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${lastfmToken.username}&api_key=${process.env.LASTFM_API_KEY}&format=json`
    ).then((r) => r.json());

    return res.json({
      connected: true,
      username: lastfmToken.username,
      userInfo: {
        name: lastfmInfo.user?.name,
        url: lastfmInfo.user?.url,
        playcount: lastfmInfo.user?.playcount,
        country: lastfmInfo.user?.country,
      },
    });
  } catch (error) {
    console.error("Status check error:", error);
    return res.status(500).json({ connected: false });
  }
});

// Keep JWT auth only for user-specific API endpoints
app.get("/api/lastfm/status", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res
        .status(404)
        .json({ connected: false, message: "User not found" });
    }
    const lastfmToken = user.tokens.find((t) => t.type === "lastfm");
    return res.json({
      connected: !!lastfmToken,
      username: lastfmToken?.username || null,
      lastfmKey: lastfmToken?.key || null,
      debugInfo: {
        userId: user._id,
        email: user.email,
        tokensCount: user.tokens.length,
      },
    });
  } catch (error) {
    console.error("Status check error:", error);
    return res
      .status(500)
      .json({ connected: false, error: "Internal server error" });
  }
});

// Add this new endpoint
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

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
