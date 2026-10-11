"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Timeline from "./Timeline";
import { AnimatePresence, motion } from "framer-motion";
import { syllabify } from "./syllable";
import { initPlayer, playSong } from "../player";
import { ImportLyrics } from "./ImportLyrics";
import { LyricSyncer } from "./LyricSyncer";
import { uploadLyricsAction } from "@/actions";
import { compressLyrics } from "./lyricsCompressor";
import { useRouter } from "next/navigation";

const EditorPage = () => {
  const player = useRef<any>(null);

  const [overlay, setOverlay] = useState<null | "importLyrics">(null);
  const [lyrics, setLyrics] = useState<Lyrics | null>(null);
  const [vocal, setVocal] = useState<VoiceType>("lead");
  const [done, setDone] = useState(false);

  const [songInfo, setSongInfo] = useState(["...", "..."]);
  const fullSongInfo = useRef<any>(null);
  const scrollableLyrics = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const song = localStorage.getItem("song");

    initPlayer(token!)
      .then((p: any) => {
        player.current = p;
        p.setVolume(0);
        playSong(song!).then(() => {
          let inter = setInterval(() => {
            p.getCurrentState().then((state: any) => {
              if (!state) {
                console.log("TRY");
                return;
              }
              console.log("YES STATE");

              clearInterval(inter);
              setTimeout(() => {
                p.pause().then(() => {
                  p.seek(0);
                  p.setVolume(0.5);
                });
              }, 500);

              fullSongInfo.current = state.track_window.current_track;
              setSongInfo([
                state.track_window.current_track.name,
                state.track_window.current_track.artists[0].name,
              ]);
            });
          }, 100);
        });
      })
      .catch((e) => {
        console.error(e);
        alert("Failed to initialize player");
      });
  }, []);

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (!lyrics) return;
      if (e.key === "q") {
        if (!lyrics.types.includes("lead")) return;
        setVocal("lead");
      } else if (e.key === "w") {
        if (!lyrics.types.includes("background")) return;
        setVocal("background");
      } else if (e.key === "e") {
        if (!lyrics.types.includes("duet")) return;
        setVocal("duet");
      } else if (e.key === "p") {
        player.current.togglePlay();
      }
    };

    window.addEventListener("keydown", handleKeydown);

    return () => window.removeEventListener("keydown", handleKeydown);
  }, [lyrics]);

  return (
    <div className="w-full h-full bg-black text-white p-4 pb-0 flex flex-col items-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold">{songInfo[0]}</h1>
        <h2 className="text-2xl font-medium">{songInfo[1]}</h2>
      </div>
      <div
        className="bg-white/10 rounded-lg m-6 flex-1 w-1/2 relative overflow-y-scroll no-scrollbar"
        ref={scrollableLyrics}
      >
        {lyrics ? (
          <LyricSyncer
            setVocal={setVocal}
            fullLyrics={lyrics}
            vocal={vocal}
            player={player}
            parent={scrollableLyrics}
            setDone={setDone}
          />
        ) : (
          <button
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-black bg-white px-5 py-2 rounded-lg font-bold text-xl"
            onClick={() => setOverlay("importLyrics")}
          >
            Import Lyrics
          </button>
        )}
      </div>
      <div className="w-full p-5 flex justify-center overflow-x-hidden">
        <Timeline player={player} vocal={vocal} />
      </div>

      {/* Absolutes */}

      {lyrics && (
        <>
          <div className="absolute right-0 top-0 h-full flex flex-col justify-center gap-3 overflow-hidden items-end">
            <VoiceTabSelector
              currentVocal={vocal}
              vocal={"lead"}
              setVocal={setVocal}
            />
            {lyrics.types.includes("background") && (
              <VoiceTabSelector
                currentVocal={vocal}
                vocal={"background"}
                setVocal={setVocal}
              />
            )}
            {lyrics.types.includes("duet") && (
              <VoiceTabSelector
                currentVocal={vocal}
                vocal={"duet"}
                setVocal={setVocal}
              />
            )}
          </div>
        </>
      )}

      {overlay && (
        <div className="fixed left-0 top-0 w-full h-full bg-black/90 flex items-center justify-center">
          {overlay === "importLyrics" ? (
            <ImportLyrics
              done={(l: Lyrics) => {
                setLyrics(l);
                setOverlay(null);
              }}
            />
          ) : null}
        </div>
      )}

      <button
        disabled={!done}
        onClick={async () => {
          setDone(false);
          console.log("UPLOADING");
          const res = await uploadLyricsAction(
            fullSongInfo.current.id,
            compressLyrics(lyrics!)
          );
          if (res.success) {
            if (player.current) {
              player.current.disconnect();
            }
            router.replace(`/song/${res.isrc}`);
          }
        }}
        className="absolute right-4 bottom-4 text-black bg-white px-4 py-1 rounded font-bold text-xl disabled:bg-white/30 enabled:hover:-translate-x-0.5 enabled:hover:-translate-y-0.5 enabled:hover:shadow-md enabled:hover:shadow-white/20 enabled:active:translate-x-0 enabled:active:translate-y-0 enabled:active:shadow-none duration-150"
      >
        Done
      </button>
    </div>
  );
};

const VoiceTabSelector = ({
  setVocal,
  vocal,
  currentVocal,
}: {
  setVocal: any;
  vocal: VoiceType;
  currentVocal: VoiceType;
}) => {
  const selected = vocal === currentVocal;
  return (
    <div
      onClick={() => {
        if (!selected) setVocal(vocal);
      }}
      className={`${
        vocal === "lead"
          ? "bg-green-400"
          : vocal === "background"
          ? "bg-sky-400"
          : "bg-fuchsia-400"
      } text-black h-28 duration-300 ${
        selected
          ? "rounded-l-[75px] w-[227px] cursor-default"
          : "rounded-l-[12px] w-16 pl-5 cursor-pointer"
      }`}
    >
      {selected ? (
        <div className="flex flex-col justify-center items-center h-full w-[227px] ml-2">
          <h2 className="font-medium text-xl">Currently syncing:</h2>
          <h1 className="text-3xl font-bold">
            {vocal === "lead"
              ? "Lead"
              : vocal === "background"
              ? "Background"
              : "Duet"}
          </h1>
        </div>
      ) : (
        <h1 className="text-xl font-bold text-wrap leading-6 h-full pr-4 flex items-center w-0">
          {vocal === "lead"
            ? "L E A D"
            : vocal === "background"
            ? "B A C K"
            : "D U E T"}
        </h1>
      )}
    </div>
  );
};

export type Part = {
  text: string;
  time: number | null;
  endTime?: number;
};

export type Word = {
  parts: Part[];
  type: VoiceType;
  index: number;
};

export type Line = {
  before: Word[];
  duet: Word[];
  line: Word[];
  after: Word[];
  index: number;
  start?: number;
  end?: number;
  duetbefore?: boolean;
};

export type Lyrics = {
  lines: Line[];
  types: VoiceType[];
};

export type VoiceType = "lead" | "background" | "duet";

export default EditorPage;
