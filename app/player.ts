let player: any = null;
let token: string | null = null;
let deviceId: string | null = null;

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: any;
    Spotify: any;
  }
}

export function initPlayer(newToken: string, tokenFunction: any = null) {
  token = newToken;
  return new Promise((resolve, reject) => {
    if (player !== null) {
      resolve(player);
    }

    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;

    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const newPlayer = new window.Spotify.Player({
        name: "BakbakLyrics",
        getOAuthToken: async (cb: any) => {
          if (tokenFunction) {
            newToken = await tokenFunction();
          }
          cb(newToken);
        },
        volume: 0.5,
      });

      player = newPlayer;

      player.addListener("ready", ({ device_id }: { device_id: string }) => {
        console.log("Ready with Device ID", device_id);
        deviceId = device_id;
        resolve(player);
      });

      player.addListener(
        "not_ready",
        ({ device_id }: { device_id: string }) => {
          console.log("Device ID has gone offline", device_id);
        }
      );

      player.connect().catch(reject);
    };
  });
}

export async function playSong(id: string) {
  if (player === null) return;
  const res = await fetch(
    "https://api.spotify.com/v1/me/player/play?device_id=" + deviceId,
    {
      method: "PUT",
      headers: {
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({
        uris: ["spotify:track:" + id],
      }),
    }
  );

  return res.ok;
}
