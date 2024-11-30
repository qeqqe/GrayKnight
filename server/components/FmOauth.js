require("dotenv").config();
const LastFmStrategy = require("passport-lastfm");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const fetch = require("node-fetch");
const crypto = require("crypto");
const User = require("../model/User");

const callBackURL =
  process.env.LASTFM_CALLBACK_URL ||
  "http://localhost:3001/auth/lastfm/callback";

passport.use(
  new LastFmStrategy(
    {
      api_key: process.env.LASTFM_API_KEY,
      secret: process.env.LASTFM_SECRET,
      callbackURL: callBackURL,
      passReqToCallback: true,
    },
    async (req, token, done) => {
      try {
        console.log("📍 Strategy Execution:", {
          token,
          session: req.session,
          query: req.query,
        });

        const params = new URLSearchParams({
          method: "auth.getSession",
          api_key: process.env.LASTFM_API_KEY,
          token: token,
        });

        const sigString =
          Array.from(params.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${k}${v}`)
            .join("") + process.env.LASTFM_SECRET;

        const apiSig = crypto.createHash("md5").update(sigString).digest("hex");

        console.log("📍 Making Last.fm API request with:", {
          token,
          apiSig: apiSig.substring(0, 8) + "...", // Log partial signature for debugging
        });

        const response = await fetch(
          `http://ws.audioscrobbler.com/2.0/?method=auth.getSession&api_key=${process.env.LASTFM_API_KEY}&token=${token}&api_sig=${apiSig}&format=json`
        );

        const data = await response.json();
        console.log("📍 Last.fm API response:", data);

        if (data.error || !data.session) {
          throw new Error(
            `Last.fm API error: ${data.message || JSON.stringify(data)}`
          );
        }

        const authToken = req.query.auth_token || req.session?.jwt_token;
        if (!authToken) {
          throw new Error("No auth token found");
        }

        const decoded = jwt.verify(authToken, process.env.JWT_SECRET);
        console.log("📍 Decoded JWT:", decoded);

        const user = await User.findByIdAndUpdate(
          decoded.userId,
          {
            $set: {
              "tokens.lastfm": {
                username: data.session.name,
                key: data.session.key,
              },
            },
          },
          { new: true }
        );

        if (!user) {
          throw new Error("User not found");
        }

        console.log("📍 Updated user:", {
          id: user._id,
          lastfm: user.tokens?.lastfm,
        });

        return done(null, user);
      } catch (error) {
        console.error("📍 Strategy error:", error);
        return done(error);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
