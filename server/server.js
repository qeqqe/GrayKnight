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
dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;
const app = express();
const port = process.env.PORT || 3001;
const verifyToken = require("./components/authVerifier");
const ConnectDB = require("./components/ConnectDB");
app.use(cors());
app.use(bodyParser.json());
app.use(passport.initialize());

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

    const accessToken = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        username: user.username,
        iat: Date.now(),
      },
      JWT_SECRET,
      { expiresIn: "500h" }
    );

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

app.get("/auth/lastfm", verifyToken, (req, res, next) => {
  // Store user ID in session
  req.authInfo = { userId: req.user.userId };
  passport.authenticate("lastfm")(req, res, next);
});

app.get("/auth/lastfm/callback", (req, res, next) => {
  passport.authenticate("lastfm", async (err, sessionKey) => {
    if (err) {
      console.error("Last.fm auth error:", err);
      return res.redirect(
        `${process.env.CLIENT_URL}/dashboard?error=auth_failed`
      );
    }

    try {
      // Get the original user ID from the auth token in the header
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(" ")[1];
      let userId;

      if (token) {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.userId;
      }

      if (!userId) {
        console.error("No user ID found");
        return res.redirect(
          `${process.env.CLIENT_URL}/dashboard?error=no_user`
        );
      }

      // Update user with Last.fm credentials
      const user = await User.findById(userId);
      if (!user) {
        return res.redirect(
          `${process.env.CLIENT_URL}/dashboard?error=user_not_found`
        );
      }

      // Update user's Last.fm tokens
      if (!user.tokens) user.tokens = [];
      user.tokens.push({
        type: "lastfm",
        username: sessionKey.username,
        key: sessionKey.key,
      });
      user.lastfm = sessionKey.key;

      await user.save();
      return res.redirect(`${process.env.CLIENT_URL}/dashboard?success=true`);
    } catch (error) {
      console.error("Error saving Last.fm token:", error);
      return res.redirect(
        `${process.env.CLIENT_URL}/dashboard?error=save_failed`
      );
    }
  })(req, res, next);
});

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

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
