const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  lastfmUsername: String,
  lastFmConnected: {
    type: Boolean,
    default: false,
  },
  spotifyId: String,
  spotifyAccessToken: String,
  spotifyRefreshToken: String,
  spotifyTokenExpiry: Date,
  spotifyConnected: {
    type: Boolean,
    default: false,
  },
  createdAt: { type: Date, default: Date.now },
  songs: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Song",
    },
  ],
});

module.exports = mongoose.model("User", userSchema);
