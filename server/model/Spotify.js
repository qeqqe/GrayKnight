const mongoose = require("mongoose");

const SpotifySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  SpotifyId: {
    type: String,
    unique: true,
    required: true,
  },
});
