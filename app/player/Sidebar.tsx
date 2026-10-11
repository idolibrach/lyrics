import Image from "next/image";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Separator from "../components/Separator";
import { SearchBar, SearchResult } from "../Search";
import { searchSongAction } from "@/actions";

const Sidebar = ({
  play,
  queue,
  addToQueue,
}: {
  play: any;
  queue: any[];
  addToQueue: any;
}) => {
  const [open, setOpen] = useState(true);
  const [searchOffset, setSearchOffset] = useState(24);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const searchOpen = searchOffset !== 24;
  const searchref = useRef<HTMLDivElement>(null);

  console.log(searchOffset);

  const setSearchOpen = useCallback(
    (oopen: boolean) => {
      if (!searchref.current) return;
      if (oopen) {
        if (searchOffset !== 24) return;
        setSearchOffset(searchref.current.offsetTop * -1 + 24 + 32);
      } else {
        if (searchOffset === 24) return;
        setSearchOffset(24);
      }
    },
    [searchOffset]
  );

  useEffect(() => {
    if (!open) {
      setSearchOpen(false);
      setSearchResults([]);
    }
  }, [open]);

  const search = useCallback(
    async (s: string) => {
      try {
        setSearching(true);
        setSearchOpen(true);
        const data = await searchSongAction(s, true);
        console.log(data);

        setSearchResults(
          data.tracks.items.map((t: any) => {
            return {
              name: t.name,
              artists: t.artists.map((a: any) => a.name),
              albumArt: t.album.images[2].url,
              id: t.external_ids.isrc,
              explicit: t.explicit,
              spotifyId: t.id,
              synced: t.existsInDB,
            };
          })
        );
      } finally {
        setSearching(false);
      }
    },
    [setSearching, setSearchResults, setSearchOpen]
  );

  return (
    <div className="absolute top-0 right-0">
      <div
        className="relative bg-neutral-900 w-[500px] h-[100vh] duration-500 flex flex-col items-center px-4 py-8"
        style={{
          right: open ? 0 : -500,
        }}
      >
        <div
          className="absolute left-0 top-4 -translate-x-full h-14 duration-[400ms] rounded-l-lg bg-neutral-900 flex items-center justify-center cursor-pointer"
          style={{
            width: open ? 42 : 62,
          }}
          onClick={() => {
            setOpen(!open);
          }}
        >
          <Image
            src={open ? "/smallright.svg" : "/menu.svg"}
            alt="Toggle menu"
            width={42}
            height={42}
            className="invert"
          />
        </div>

        <h1 className="text-4xl font-bold">Queue</h1>
        <div className="mt-4 px-12 w-full max-h-[50%] overflow-y-auto no-scrollbar">
          {queue.map((track, i) => (
            <QueueItem key={i} track={track} />
          ))}
        </div>

        <div className="w-full px-4 flex justify-center mt-6">
          <Separator />
        </div>

        <div
          ref={searchref}
          className={`w-full px-8 bg-neutral-900 h-[70px] duration-500 z-[200] ${
            searchOpen ? "h-full" : ""
          }`}
          style={{
            marginTop: searchOffset,
          }}
        >
          <SearchBar search={search} searching={searching} />
          {searchOpen && (
            <div>
              {searchResults.map((track, i) => (
                <div
                  onClick={() => {
                    // if (!track.synced) return;
                    // play(track.spotifyId, track.id);
                    // setSearchOpen(false);
                  }}
                  key={i}
                  className={`rounded-lg bg-white/5 max-w-full mt-3 p-3 flex items-center h-24 w-[600px] cursor-default ${
                    track.synced ? "" : "opacity-50"
                  }`}
                >
                  <img
                    src={track.albumArt}
                    alt="Album Art"
                    className="aspect-square h-full mr-4 rounded"
                  />
                  <div className="flex-1 flex justify-between items-center">
                    <div className="flex flex-col justify-center items-start flex-1 w-1">
                      <div className="text-ellipsis overflow-hidden whitespace-nowrap max-w-full">
                        {track.name}
                      </div>
                      <div className="text-white/50 flex items-center">
                        {track.explicit && (
                          <span className="bg-white/50 w-5 h-5 flex items-center justify-center rounded text-black mr-1 text-sm">
                            E
                          </span>
                        )}
                        <span>{track.artists.join(", ")}</span>
                      </div>
                    </div>
                    {track.synced && (
                      <div className="flex items-center gap-1">
                        <button
                          className="w-[43px] h-[43px] bg-green-400 rounded-full flex items-center justify-center hover:opacity-80"
                          onClick={() => {
                            if (!track.synced) return;
                            addToQueue(track);
                            setSearchOpen(false);
                          }}
                        >
                          <Image
                            src="/queue.svg"
                            alt="Queue"
                            width={32}
                            height={32}
                            title="Add to Queue"
                          />
                        </button>
                        <button
                          className="w-[43px] h-[43px] bg-green-400 rounded-full flex items-center justify-center hover:opacity-80"
                          onClick={() => {
                            if (!track.synced) return;
                            play(track.spotifyId, track.id);
                            setOpen(false);
                          }}
                        >
                          <Image
                            src="/playarrow.svg"
                            alt="Play"
                            width={32}
                            height={32}
                            title="Play Now"
                          />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const QueueItem = ({ track }: { track: any }) => {
  return (
    <div className="w-full h-20 bg-neutral-800 rounded-lg flex items-center px-4 mt-2">
      <div className="w-16 h-16 rounded-lg bg-neutral-700 relative overflow-hidden">
        <Image src={track.albumArt} alt="Album Art" fill={true} />
      </div>
      <div className="ml-4">
        <h1 className="text-xl font-bold">{track.name}</h1>
        <p className="text-lg">{track.artists.join(", ")}</p>
      </div>
    </div>
  );
};

export default Sidebar;
