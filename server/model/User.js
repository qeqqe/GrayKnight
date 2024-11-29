const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastfm: String,
  tokens: [
    {
      type: { type: String },
      username: String,
      key: String,
    },
  ],
});

const User = mongoose.model("User", UserSchema);

module.exports = User;
