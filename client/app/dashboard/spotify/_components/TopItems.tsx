import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AudioWaveform, MicVocal } from "lucide-react";
import React from "react";
import TopArtists from "./TopArtists";
import TopSongs from "./TopSongs";
const TopItems = () => {
  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-8 space-y-8">
      <Tabs
        defaultValue="artist"
        className="space-y-6 gap-4 rounded-xl overflow-x-auto"
      >
        <TabsList className="w-fit justify-start flex gap-4 border-b rounded-xl px-[0.7rem] h-12">
          <TabsTrigger value="artist" className="flex items-center">
            <MicVocal className="w-4 h-4 mr-2" /> Artists
          </TabsTrigger>
          <TabsTrigger value="tracks" className="flex items-center">
            <AudioWaveform className="w-4 h-4 mr-2" /> Tracks
          </TabsTrigger>
        </TabsList>
        <TabsContent value="artist">
          <TopArtists />
        </TabsContent>
        <TabsContent value="tracks">
          <TopSongs />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TopItems;
