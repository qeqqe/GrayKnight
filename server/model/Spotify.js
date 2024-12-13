const mongoose = require("mongoose");

const SpotifySchema = new mongoose.Schema({
  app_user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  spotify_id: {
    type: String,
    required: true,
  },
  scrobbles: {
    type: Number,
    required: true,
    default: 0,
  },
  recently_played: [
    {
      song: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Song",
      },
      played_at: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

module.exports = mongoose.model("Spotify", SpotifySchema);
