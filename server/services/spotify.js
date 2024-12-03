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
      },
      async function (accessToken, refreshToken, expires_in, profile, done) {
        try {
          // Store the tokens and profile
          return done(null, {
            tokens: { accessToken, refreshToken, expiresIn: expires_in },
            profile: profile,
          });
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((user, done) => done(null, user));
}

module.exports = configurePassport;
