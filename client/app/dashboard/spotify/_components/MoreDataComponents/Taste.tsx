import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface AudioFeatures {
  danceability: number;
  energy: number;
  valence: number;
  instrumentalness: number;
  acousticness: number;
  tempo: number;
}

const Taste = () => {
  const [features, setFeatures] = useState<AudioFeatures[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAudioFeatures = async () => {
      try {
        const token = localStorage.getItem("spotify_access_token");
        const tracksResponse = await fetch(
          "https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=short_term",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const tracksData = await tracksResponse.json();
        const trackIds = tracksData.items.map((track: any) => track.id);

        const featuresResponse = await fetch(
          `https://api.spotify.com/v1/audio-features?ids=${trackIds.join(",")}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const featuresData = await featuresResponse.json();
        setFeatures(featuresData.audio_features);
      } catch (error) {
        console.error("Failed to fetch audio features:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAudioFeatures();
  }, []);

  const averageFeatures = features.reduce(
    (acc, feature) => ({
      danceability: acc.danceability + feature.danceability,
      energy: acc.energy + feature.energy,
      valence: acc.valence + feature.valence,
      instrumentalness: acc.instrumentalness + feature.instrumentalness,
      acousticness: acc.acousticness + feature.acousticness,
      tempo: acc.tempo + feature.tempo,
    }),
    {
      danceability: 0,
      energy: 0,
      valence: 0,
      instrumentalness: 0,
      acousticness: 0,
      tempo: 0,
    }
  );

  const count = features.length || 1;
  Object.keys(averageFeatures).forEach((key) => {
    averageFeatures[key as keyof AudioFeatures] /= count;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Music Taste</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FeatureBar
          label="Danceability"
          value={averageFeatures.danceability * 100}
        />
        <FeatureBar label="Energy" value={averageFeatures.energy * 100} />
        <FeatureBar
          label="Mood"
          value={averageFeatures.valence * 100}
          description={`${
            averageFeatures.valence > 0.5 ? "More positive" : "More melancholic"
          }`}
        />
        <FeatureBar
          label="Acousticness"
          value={averageFeatures.acousticness * 100}
        />
        <div className="text-sm text-muted-foreground mt-4">
          Average Tempo: {Math.round(averageFeatures.tempo)} BPM
        </div>
      </CardContent>
    </Card>
  );
};

const FeatureBar = ({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description?: string;
}) => (
  <div>
    <div className="flex justify-between mb-1">
      <span className="text-sm font-medium">{label}</span>
      <span className="text-sm text-muted-foreground">
        {Math.round(value)}%
      </span>
    </div>
    <Progress value={value} />
    {description && (
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    )}
  </div>
);

export default Taste;
