const mongoose = require("mongoose");

const artistSchema = new mongoose.Schema({
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
  category: [{ type: String }],
  image_url: String,
  uri: String,
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Artist", artistSchema);
