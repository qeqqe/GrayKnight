import { useEffect, useState } from "react";
import { SpotifyDevice } from "../types";
import { Laptop, Smartphone, Speaker, Tv } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Form, FormControl } from "@/components/ui/form";

export const DevicesSection = () => {
  const [devices, setDevices] = useState<SpotifyDevice[]>([]);
  const [transferring, setTransferring] = useState<string | null>(null);
  const [volumeAdjusting, setVolumeAdjusting] = useState<string | null>(null);
  const [volumeInput, setVolumeInput] = useState<string>("");
  const [openPopover, setOpenPopover] = useState<string | null>(null);

  const getDeviceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "computer":
        return <Laptop className="w-4 h-4" />;
      case "smartphone":
        return <Smartphone className="w-4 h-4" />;
      case "speaker":
        return <Speaker className="w-4 h-4" />;
      case "tv":
        return <Tv className="w-4 h-4" />;
      default:
        return <Speaker className="w-4 h-4" />;
    }
  };

  const fetchDevices = async () => {
    try {
      const token = localStorage.getItem("spotify_access_token");
      const response = await fetch(
        "https://api.spotify.com/v1/me/player/devices",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch devices");

      const data = await response.json();
      setDevices(data.devices);
      const activeDevice = data.devices.find(
        (device: SpotifyDevice) => device.is_active
      );
      if (activeDevice) {
        localStorage.setItem("active_device_id", activeDevice.id);
      }
    } catch (error) {
      console.error("Failed to fetch devices:", error);
    }
  };

  const transferPlayback = async (deviceId: string) => {
    if (transferring) return;

    setTransferring(deviceId);
    try {
      const token = localStorage.getItem("spotify_access_token");
      const response = await fetch("https://api.spotify.com/v1/me/player", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          device_ids: [deviceId],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to transfer playback");
      }

      await fetchDevices();

      setTimeout(async () => {
        await fetchDevices();
      }, 3000);
    } catch (error) {
      console.error("Failed to transfer playback:", error);
    } finally {
      setTransferring(null);
    }
  };

  const adjustVolume = async (deviceId: string, volume: number) => {
    try {
      const token = localStorage.getItem("spotify_access_token");
      const response = await fetch(
        `https://api.spotify.com/v1/me/player/volume?volume_percent=${volume}&device_id=${deviceId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to adjust volume");
      }

      await fetchDevices();
    } catch (error) {
      console.error("Failed to adjust volume:", error);
    }
  };

  const handleVolumeSubmit = async (
    e: React.KeyboardEvent<HTMLInputElement>,
    deviceId: string
  ) => {
    if (e.key === "Enter") {
      const volume = parseInt((e.target as HTMLInputElement).value);
      if (volume >= 0 && volume <= 100) {
        await adjustVolume(deviceId, volume);
        setVolumeAdjusting(null);
      }
    }
  };

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!devices.length) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
        Available Devices
      </h2>
      <div className="space-y-2 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-lg p-4">
        {devices.map((device) => (
          <div
            key={device.id}
            className="flex items-center gap-3 p-2 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/50 rounded-md"
          >
            <div className="flex-1 flex items-center gap-3">
              <div className="text-green-600 dark:text-green-400">
                {getDeviceIcon(device.type)}
              </div>
              <div className="flex-1">
                <p className="font-medium text-zinc-900 dark:text-white">
                  {device.name}
                  {device.is_active && (
                    <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                      • Active
                    </span>
                  )}
                  {transferring === device.id && (
                    <span className="ml-2 text-xs text-yellow-600 dark:text-yellow-400">
                      • Transferring...
                    </span>
                  )}
                </p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  {device.type.charAt(0).toUpperCase() + device.type.slice(1)}
                  {device.volume_percent !== null && (
                    <>
                      {device.is_active ? (
                        <Popover
                          open={openPopover === device.id}
                          onOpenChange={(open) => {
                            if (open) {
                              setVolumeInput(
                                device.volume_percent?.toString() || ""
                              );
                              setOpenPopover(device.id);
                            } else {
                              setOpenPopover(null);
                            }
                          }}
                        >
                          <PopoverTrigger asChild>
                            <span className="ml-2 cursor-pointer text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                              • Volume: {device.volume_percent}%
                            </span>
                          </PopoverTrigger>
                          <PopoverContent className="w-40 bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
                            <form
                              onSubmit={async (e) => {
                                e.preventDefault();
                                const volume = parseInt(volumeInput);
                                if (volume >= 0 && volume <= 100) {
                                  await adjustVolume(device.id, volume);
                                  setOpenPopover(null);
                                }
                              }}
                            >
                              <div className="flex gap-2">
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  placeholder="0-100"
                                  value={volumeInput}
                                  onChange={(e) =>
                                    setVolumeInput(e.target.value)
                                  }
                                  className="text-sm bg-transparent"
                                />
                                <Button
                                  type="submit"
                                  size="sm"
                                  variant="secondary"
                                  className="bg-zinc-100 dark:bg-zinc-700"
                                >
                                  Set
                                </Button>
                              </div>
                            </form>
                          </PopoverContent>
                        </Popover>
                      ) : (
                        <span className="ml-2 text-zinc-500 dark:text-zinc-500">
                          • Volume: {device.volume_percent}%
                        </span>
                      )}
                    </>
                  )}
                </p>
              </div>
            </div>
            {!device.is_active && (
              <Button
                variant="ghost"
                size="sm"
                className="text-yellow-600 hover:text-yellow-700 dark:text-yellow-500 dark:hover:text-yellow-400"
                onClick={() => transferPlayback(device.id)}
                disabled={transferring !== null}
              >
                Transfer
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
