const passport = require("passport");
const SpotifyStrategy = require("passport-spotify").Strategy;
const User = require("../model/User");
require("dotenv").config();

function configurePassport() {
  passport.use(
    new SpotifyStrategy(
      {
        clientID: process.env.SPOTIFY_API_KEY,
        clientSecret: process.env.SPOTIFY_SECRET,
        callbackURL: process.env.SPOTIFY_CALLBACK_URL,
        passReqToCallback: true,
      },
      async function (
        req,
        accessToken,
        refreshToken,
        expires_in,
        profile,
        done
      ) {
        try {
          const userId = req.session?.userId;
          console.log("Spotify auth callback:", {
            userId,
            profileId: profile.id,
          });

          if (!userId) {
            return done(new Error("No user ID in session"));
          }

          return done(null, {
            userId,
            tokens: { accessToken, refreshToken, expiresIn: expires_in },
          });
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  // Simplify serialization
  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((user, done) => done(null, user));
}

module.exports = configurePassport;
