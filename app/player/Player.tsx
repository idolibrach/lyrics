"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import LyricsDisplay from "./Lyrics";
import { getLyrics, getSpotifyTokenAction } from "@/actions";
import { decompressLyrics } from "../editor/lyricsCompressor";
import { Lyrics } from "../editor/page";
import Image from "next/image";
import { getPlayerReadyLyrics } from "@/utils";
import { initPlayer, playSong } from "../player";
import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import BlurAlbumBackground from "../components/BlurAlbumBackground";

const Player = ({ initialSong }: { initialSong?: string }) => {
  const [lyrics, setLyrics] = useState<Lyrics | null>(null);
  const [songInfo, setSongInfo] = useState<any>(null);
  const [ready, setReady] = useState(false);
  const spotify = useRef<{ token: string; expire: number } | null>(null);
  const router = useRouter();
  const player = useRef<any>(null);
  const playeractivated = useRef(false);
  const [queue, setQueue] = useState<any[]>([]);
  const queueref = useRef<any[]>([]);
  const playing = useRef(false);
  const laststate = useRef<any>(null);

  const getToken = useCallback(async () => {
    if (!spotify.current || spotify.current.expire - 5 * 60 * 1000 < Date.now()) {
      console.log("GETTTTT");
      const res = await getSpotifyTokenAction();
      if (!res) {
        alert("Failed to access Spotify - please reconnect it or try again later");
        router.replace("/");
        return;
      }
      spotify.current = { token: res, expire: Date.now() + 3600000 };
    }
    return spotify.current.token;
  }, []);

  const play = useCallback(async (spotifyId: string, isrc: string) => {
    if (!player.current) return;
    let lyrics = await getLyrics(isrc);
    if (lyrics) {
      setLyrics(getPlayerReadyLyrics(decompressLyrics(lyrics)));
    } else {
      console.log("LYRICS NOT FOUND!");
      router.replace("/");
      return;
    }
    playSong(spotifyId).then(() => {
      let inter = setInterval(() => {
        player.current.getCurrentState().then((state: any) => {
          if (!state) return;
          clearInterval(inter);
          setSongInfo(state.track_window.current_track);
        });
      }, 100);
    });
  }, []);

  const addToQueue = useCallback(
    (song: any) => {
      if (!queueref.current) return;
      if (queueref.current.length === 0 && !playing.current) {
        play(song.spotifyId, song.id);
        return;
      }
      queueref.current.push(song);
      setQueue([...queueref.current]);
    },
    [play]
  );

  const nextSong = useCallback(() => {
    console.log("CALL NEXT");
    if (!queueref.current) return false;
    if (queueref.current.length === 0) return false;
    let song = queueref.current.shift();
    if (!song) return false;
    play(song.spotifyId, song.id);
    setQueue([...queueref.current]);
    return true;
  }, [play]);

  useEffect(() => {
    const start = async () => {
      if (initialSong) {
        let initialLyrics = await getLyrics(initialSong);
        // let initialLyrics = templyrics;
        if (initialLyrics) {
          setLyrics(getPlayerReadyLyrics(decompressLyrics(initialLyrics)));
        } else {
          router.replace("/");
          return;
        }
      }

      const token = await getToken();
      initPlayer(token!, getToken)
        .then((p: any) => {
          player.current = p;
          setReady(true);
          p.addListener("player_state_changed", (state: any) => {
            // if (!state) {
            //   return;
            // }
            // if (state.position === 0 && playing.current) {
            //   console.log("PLAY NEXT");
            //   playing.current = false;
            //   nextSong();
            // } else if (state.position !== 0) {
            //   console.log(`STATE: ${state.position} / ${state.duration}`);
            //   playing.current = true;
            // }
            if (
              laststate.current &&
              state.track_window.previous_tracks.find((x: any) => x.id === state.track_window.current_track.id) &&
              !laststate.current.paused &&
              state.paused
            ) {
              console.log("Track ended");
              playing.current = false;
              nextSong();
              // this.setTrackEnd(true);
            } else if (state.position !== 0) {
              console.log("PLAYING!");
              playing.current = true;
            }
            laststate.current = state;
          });
        })
        .catch((e) => {
          console.error(e);
          alert("Failed to initialize player");
        });
    };

    start();
  }, [initialSong, getToken, router]);
  return (
    <div
      className="w-full h-full flex items-center justify-center relative"
      onClick={() => {
        if (player.current && !playeractivated.current) {
          playeractivated.current = true;
          player.current.activateElement();
          console.log("Activ");
        }
      }}
    >
      {ready && lyrics && songInfo ? (
        <>
          <div className="relative">
            <Image src={songInfo.album.images[0].url} alt={"Album Cover"} width={450} height={450} priority={true} className="rounded-lg drop-shadow-lg" />
            <button onClick={() => player.current.pause()}>PAUSE</button>
            <button onClick={() => player.current.resume()}>RESUME</button>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full text-center w-full">
              <h1 className="text-3xl font-bold drop-shadow mt-4">{songInfo.name}</h1>
              <h2 className="text-xl drop-shadow mt-1">{songInfo.artists.map((a: any) => a.name).join(", ")}</h2>
            </div>
            <BlurAlbumBackground url={songInfo.album.images[0].url} />
          </div>
          <LyricsDisplay lyrics={lyrics} player={player} />
        </>
      ) : null}
      <Sidebar play={play} queue={queue} addToQueue={addToQueue} />
    </div>
  );
};

/*

<button
        onClick={async () => {
          const token = await getToken();
          initPlayer(token!, getToken)
            .then((p: any) => {
              player.current = p;
              setReady(true);
              if (initialSong) {
                playSong(initialSong).then(() => {
                  let inter = setInterval(() => {
                    p.getCurrentState().then((state: any) => {
                      if (!state) {
                        console.log("TRY2");
                        return;
                      }
                      console.log("YES STATE2");
                      p.resume();
                      clearInterval(inter);

                      setSongInfo(state.track_window.current_track);
                    });
                  }, 100);
                });
              }
            })
            .catch((e) => {
              console.error(e);
              alert("Failed to initialize player");
            });
        }}
      >
        eee
      </button>
      <Image
        src="https://i.scdn.co/image/ab67616d0000b27371d62ea7ea8a5be92d3c1f62"
        alt={"BIRDS OF A FEATHER"}
        width={450}
        height={450}
        priority={true}
        className="rounded-lg"
      />
      {ready && <LyricsDisplay lyrics={lyrics} player={player} />}
*/

export default Player;
