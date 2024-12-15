const mongoose = require("mongoose");

const songSchema = new mongoose.Schema({
  spotify_id: {
    type: String,
    required: true,
    unique: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  name: {
    type: String,
    required: true,
  },
  artist: {
    name: String,
    spotify_id: String,
    uri: String,
  },
  image_url: String,
  uri: String,
  play_count: {
    type: Number,
    default: 0,
  },
  last_played: {
    type: Date,
    default: Date.now,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  scrobble_history: [
    {
      timestamp: {
        type: Date,
        required: true,
      },
      progress_ms: {
        type: Number,
        required: true,
      },
      completed: {
        type: Boolean,
        default: true,
      },
    },
  ],
});

module.exports = mongoose.model("Song", songSchema);
