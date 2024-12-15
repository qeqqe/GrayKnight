const Song = require("../model/Song");
const User = require("../model/User");

const saveListeningData = async (req, res) => {
  console.log("📝 Processing scrobble request:", {
    track: req.body.track?.name,
    progress: req.body.progress,
    isNewSession: req.body.isNewSession,
  });

  try {
    const { track, timestamp, progress, isNewSession } = req.body;
    const userId = req.user.userId;

    if (!track || !userId || !timestamp || progress === undefined) {
      return res.status(400).json({ error: "Missing required data" });
    }

    let song = await Song.findOne({ spotify_id: track.id });
    const halfDuration = track.duration_ms / 2;
    const minRequiredProgress = Math.min(halfDuration, 240000); // 4 minutes in ms

    if (progress < minRequiredProgress) {
      return res.status(400).json({
        error: "Track hasn't been played long enough to scrobble",
        required: minRequiredProgress,
        actual: progress,
      });
    }

    if (!song) {
      song = new Song({
        spotify_id: track.id,
        user: userId,
        name: track.name,
        artist: {
          name: track.artists[0].name,
          spotify_id: track.artists[0].id,
          uri: track.artists[0].uri,
        },
        image_url: track.album.images[0]?.url,
        uri: track.uri,
        play_count: 1,
        last_played: new Date(timestamp),
        scrobble_history: [
          {
            timestamp: new Date(timestamp),
            progress_ms: progress,
          },
        ],
      });
    } else {
      if (isNewSession || progress >= halfDuration) {
        song.play_count += 1;
        song.scrobble_history.push({
          timestamp: new Date(timestamp),
          progress_ms: progress,
        });
      }
      song.last_played = new Date(timestamp);
    }

    // Keep only last 50 scrobbles in history
    if (song.scrobble_history?.length > 50) {
      song.scrobble_history = song.scrobble_history.slice(-50);
    }

    const savedSong = await song.save();

    console.log("📝 Scrobble saved:", {
      name: savedSong.name,
      playCount: savedSong.play_count,
      lastPlayed: savedSong.last_played,
      isNewSession,
    });

    res.status(200).json({
      message: "Track scrobbled successfully",
      song: savedSong,
    });
  } catch (error) {
    console.error("📝 Scrobble error:", error);
    res.status(500).json({ error: "Failed to save scrobble" });
  }
};

module.exports = {
  saveListeningData,
};
