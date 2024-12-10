import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ListPlus } from "lucide-react";
import { addToQueue } from "@/lib/spotify";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface QueueButtonProps {
  trackId: string;
  deviceId?: string;
  variant?: "ghost" | "outline" | "default";
  size?: "default" | "sm" | "lg" | "icon";
}

// the queue master - adds tracks to the lineup
export function QueueButton({
  trackId,
  deviceId,
  variant = "ghost",
  size = "icon",
}: QueueButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  // yeet that track into the queue
  const handleAddToQueue = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLoading(true);

    try {
      await addToQueue(`spotify:track:${trackId}`, deviceId);
    } catch (error) {
      console.error("Failed to add to queue:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size={size}
            onClick={handleAddToQueue}
            disabled={isLoading}
          >
            <ListPlus className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Add to Queue</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
