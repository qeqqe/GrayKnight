const Song = require("../model/Song");
const User = require("../model/User");

const saveListeningData = async (req, res) => {
  console.log("📝 SaveListeningData called with:", {
    hasTrack: !!req.body.track,
    userId: req.user.userId,
    trackInfo: req.body.track
      ? {
          id: req.body.track.id,
          name: req.body.track.name,
          artist: req.body.track.artists?.[0]?.name,
        }
      : null,
  });

  try {
    const { track } = req.body;
    const userId = req.user.userId; // Get userId from the verified JWT token

    if (!track || !userId) {
      console.log("📝 Missing required data:", { hasTrack: !!track, userId });
      return res.status(400).json({ error: "Missing required data" });
    }

    console.log("📝 Checking for existing song:", track.id);
    let song = await Song.findOne({ spotify_id: track.id });
    console.log("📝 Existing song found:", !!song);

    if (!song) {
      console.log("📝 Creating new song record");
      song = new Song({
        spotify_id: track.id,
        user: userId, // Use the MongoDB ObjectId from the JWT token
        name: track.name,
        artist: {
          name: track.artists[0].name,
          spotify_id: track.artists[0].id,
          uri: track.artists[0].uri,
        },
        image_url: track.album.images[0]?.url,
        uri: track.uri,
        play_count: 1,
        last_played: new Date(),
      });
    } else {
      console.log("📝 Updating existing song:", {
        name: song.name,
        currentPlayCount: song.play_count,
      });
      song.play_count += 1;
      song.last_played = new Date();
    }

    const savedSong = await song.save();
    console.log("📝 Song saved successfully:", {
      id: savedSong._id,
      name: savedSong.name,
      playCount: savedSong.play_count,
    });

    res
      .status(200)
      .json({ message: "Track saved successfully", song: savedSong });
  } catch (error) {
    console.error("📝 Error saving track:", error);
    res
      .status(500)
      .json({ error: "Failed to save track data", details: error.message });
  }
};

module.exports = {
  saveListeningData,
};
