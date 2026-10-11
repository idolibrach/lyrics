"use client";
import { searchSongAction } from "@/actions";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";

// const Search = () => {
//   const [spotify, setSpotify] = useState<string | null>(null);
//   const router = useRouter();

//   useEffect(() => {
//     setSpotify(new URL(window.location.href).searchParams.get("token"));
//   }, []);

//   return (
//     <div className="fixed left-0 top-0 w-full h-full flex items-center justify-center">
//       <div className="bg-black w-[600px] h-[95%] rounded-lg shadow shadow-black">
//         {spotify ? (
//           <SearchSong
//             token={spotify}
//             setSelectedSong={({ id }: { id: string }) => {
//               localStorage.setItem("song", id);
//               localStorage.setItem("token", spotify);
//               router.push("/editor");
//             }}
//           />
//         ) : (
//           <ConnectToSpotify />
//         )}
//       </div>
//     </div>
//   );
// };

export const SearchSong = () => {
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  const search = useCallback(
    async (s: string) => {
      try {
        setSearching(true);
        const data = await searchSongAction(s);

        setSearchResults(
          data.tracks.items.map((t: any) => {
            return {
              name: t.name,
              artists: t.artists.map((a: any) => a.name),
              albumArt: t.album.images[2].url,
              id: t.external_ids.isrc,
              explicit: t.explicit,
              spotifyId: t.id,
            };
          })
        );
      } finally {
        setSearching(false);
      }
    },
    [setSearching, setSearchResults]
  );

  return (
    <div className="text-white">
      <SearchBar search={search} searching={searching} />
      {searchResults.map((r: any, i) => (
        <SearchResult key={i} track={r} />
      ))}
    </div>
  );
};

export const SearchResult = ({ track }: { track: any }) => {
  return (
    <Link href={`/song/${track.id}`}>
      <div className="rounded-lg bg-white/5 max-w-full mt-3 p-3 flex items-center h-24 w-[600px] hover:opacity-60 cursor-pointer">
        <img
          src={track.albumArt}
          alt="Album Art"
          className="aspect-square h-full mr-4 rounded"
        />
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
      </div>
    </Link>
  );
};

export const SearchBar = ({
  search,
  searching,
}: {
  search: any;
  searching: boolean;
}) => {
  const [searchValue, setSearch] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        search(searchValue);
      }}
    >
      <input
        className="bg-white/10 w-[600px]  max-w-full h-[70px] rounded-2xl placeholder-white/40 text-xl px-6 py-2 border-none outline-none focus:ring-2 focus:ring-green-500/80 duration-200 selection:bg-green-500/60 selection:text-white/60"
        value={searchValue}
        disabled={searching}
        onChange={(e) => setSearch(e.target.value)}
        onClick={(e) => {
          // if (document.activeElement === e.target) return;
          (e.target as HTMLInputElement).select();
          // TODO only select if not already selected
        }}
        placeholder="Search Spotify..."
      />
    </form>
  );
};

const ConnectToSpotify = () => {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <a href="/api/login">
        <div className="flex justify-center items-center bg-green-500/80 px-3 py-1 text-black rounded-lg text-xl group/spotify hover:bg-green-500 cursor-pointer duration-300 hover:rounded-xl hover:text-white">
          <div className="relative w-10 h-10 flex justify-center items-center mr-2">
            <div className="bg-black w-8 h-5 group-hover/spotify:bg-white duration-300"></div>
            <img
              src="/spotify.png"
              alt="Spotify Logo"
              className="absolute top-0 left-0 w-10 h-10 rounded-full shadow group-hover/spotify:shadow-black/50 duration-300"
            />
          </div>
          Connect
        </div>
      </a>
    </div>
  );
};
