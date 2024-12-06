import { TrackCard } from "./TrackCard";
import { spotifyTrack } from "../types";

export const CurrentlyPlaying = ({ track }: { track: spotifyTrack | null }) => {
  if (!track) return null;

  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-2">
        Currently Playing
      </h2>
      <TrackCard track={track} />
    </div>
  );
};
