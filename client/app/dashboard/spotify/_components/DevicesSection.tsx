import { useEffect, useState } from "react";
import { SpotifyDevice } from "../types";
import { Laptop, Smartphone, Speaker, Tv } from "lucide-react";
import { Button } from "@/components/ui/button";

export const DevicesSection = () => {
  const [devices, setDevices] = useState<SpotifyDevice[]>([]);
  const [transferring, setTransferring] = useState<string | null>(null);

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

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!devices.length) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white">Available Devices</h2>
      <div className="space-y-2 bg-zinc-900/50 rounded-lg p-4">
        {devices.map((device) => (
          <div
            key={device.id}
            className="flex items-center gap-3 p-2 rounded-md"
          >
            <div className="flex-1 flex items-center gap-3">
              <div className="text-green-400">{getDeviceIcon(device.type)}</div>
              <div className="flex-1">
                <p className="font-medium text-white">
                  {device.name}
                  {device.is_active && (
                    <span className="ml-2 text-xs text-green-400">
                      • Active
                    </span>
                  )}
                  {transferring === device.id && (
                    <span className="ml-2 text-xs text-yellow-400">
                      • Transferring...
                    </span>
                  )}
                </p>
                <p className="text-xs text-zinc-400">
                  {device.type.charAt(0).toUpperCase() + device.type.slice(1)}
                  {device.volume_percent !== null && (
                    <span className="ml-2">
                      • Volume: {device.volume_percent}%
                    </span>
                  )}
                </p>
              </div>
            </div>
            {!device.is_active && (
              <Button
                variant="ghost"
                size="sm"
                className="text-yellow-500 hover:text-yellow-400"
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
