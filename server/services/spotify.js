const passport = require("passport");
const SpotifyStrategy = require("passport-spotify").Strategy;
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
          console.log("Spotify auth callback received");
          return done(null, {
            tokens: { accessToken, refreshToken, expiresIn: expires_in },
            profile: profile,
            connected: true,
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
