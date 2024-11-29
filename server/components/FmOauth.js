require("dotenv").config();
const LastFmStrategy = require("passport-lastfm");
const passport = require("passport");
const _ = require("lodash");
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
    (req, sessionKey, done) => {
      // Just pass the session key through
      return done(null, sessionKey);
    }
  )
);

module.exports = passport;
