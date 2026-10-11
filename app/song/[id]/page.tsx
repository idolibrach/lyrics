import NotFound from "@/app/not-found";
import { getSong, getUser, getUserSpotifyToken } from "@/appwrite";
import Image from "next/image";
import { redirect } from "next/navigation";
import React, { Suspense } from "react";
import SyncButton from "./SyncButton";
import { decompressLyrics } from "@/app/editor/lyricsCompressor";
import Contributors from "./Contributors";

export const revalidate = 0;
export const dyamic = "force-dynamic";

function getAgo(lastUpdated: number) {
  const secondsPast = Math.floor((Date.now() - lastUpdated) / 1000);
  if (secondsPast < 60) {
    return "Just now";
  }
  if (secondsPast < 3600) {
    // Less than an hour
    const minutes = Math.floor(secondsPast / 60);
    return minutes + (minutes === 1 ? " minute ago" : " minutes ago");
  }
  if (secondsPast < 86400) {
    // Less than a day
    const hours = Math.floor(secondsPast / 3600);
    return hours + (hours === 1 ? " hour ago" : " hours ago");
  }
  if (secondsPast < 2592000) {
    // Less than a month
    const days = Math.floor(secondsPast / 86400);
    return days + (days === 1 ? " day ago" : " days ago");
  }
  if (secondsPast < 31536000) {
    // Less than a year
    const months = Math.floor(secondsPast / 2592000);
    return months + (months === 1 ? " month ago" : " months ago");
  }
  const years = Math.floor(secondsPast / 31536000);
  return years + (years === 1 ? " year ago" : " years ago");
}

const SongPage = async ({ params }: { params: { id: string } }) => {
  const { success, type, song, doc } = await getSong(params.id);
  if (!success) return <NotFound />;

  const lyrics = doc ? decompressLyrics(JSON.parse(doc.lyrics)) : null;

  const token = await getUserSpotifyToken(30);

  return (
    <div className="w-full h-full flex items-center pl-16">
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="flex items-center relative">
          <div className="text-4xl font-bold max-w-[450px]">{song.name}</div>
          <a
            className="flex items-center absolute -right-3 translate-x-full"
            href={song.external_urls.spotify}
            target="_blank"
          >
            <div className="relative before:text-black before:content-['Sourced_from_Spotify'] before:absolute before:left-1/2 before:-translate-y-full before:-translate-x-1/2 before:text-base before:pointer-events-none before:bg-green-400 before:px-3 before:py-0.5 before:rounded-full before:text-nowrap before:duration-150 before:opacity-0 hover:before:opacity-100 before:top-0 hover:before:-top-2.5">
              <Image
                src="/spotify.png"
                alt="Spotify Logo"
                height={42}
                width={42}
              />
            </div>{" "}
          </a>
        </div>
        <div className="mt-1 font-medium text-2xl max-w-[450px]">
          {song.artists.map((a: any) => a.name).join(", ")}
        </div>
        <Image
          src={song.album.images[0].url}
          alt={song.name}
          width={450}
          height={450}
          priority={true}
          className="rounded-lg mt-6"
        />
        <div
          className={`${
            doc ? "bg-green-400/80" : "bg-red-400/50"
          } rounded-full cursor-default flex items-center justify-center font-medium px-4 py-2 mt-4`}
        >
          <Image
            height={24}
            width={24}
            src={doc ? "/check.svg" : "/x.svg"}
            alt="Sync status"
            className={`${
              doc ? "bg-green-400" : "bg-red-400"
            } mr-2 rounded-full shadow-xl shadow-black`}
          />
          {doc ? "Synced" : "Not synced"}
        </div>
      </div>
      <div className="bg-white/5 h-[90%] flex-1 ml-16 rounded-lg relative overflow-y-scroll px-8 py-4 no-scrollbar select-none">
        {doc ? (
          lyrics!.lines.map((line, lineIndex) => (
            <div
              key={lineIndex}
              className="flex flex-wrap justify-start text-2xl font-bold"
            >
              {line.line.map((word, wordIndex) => (
                <div
                  key={wordIndex}
                  className={`flex mx-1 my-1 ${
                    word.type === "background" ? "text-sky-400/60" : ""
                  } ${word.parts.length === 0 ? "my-2" : ""}`}
                >
                  {word.parts.map((part) => part.text).join("")}
                </div>
              ))}
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center text-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <h1 className="text-3xl font-bold text-nowrap">
              This song is not synced and has no lyrics
            </h1>
            <SyncButton id={song.id} token={token} />
          </div>
        )}
      </div>
      <div className="pr-16 flex justify-end items-start h-[90%]">
        <div className="bg-white/5 rounded-lg w-[400px] max-w-[95%] flex flex-col p-8">
          <h1 className="font-bold text-4xl text-center mb-8">Song Info</h1>
          <h2 className="font-bold text-2xl">Contributors</h2>
          <div className="mb-6">
            {doc ? (
              <Suspense fallback={<div className="mt-2">Loading...</div>}>
                <Contributors users={doc.users} />
              </Suspense>
            ) : (
              <div className="mt-2">Unavailable</div>
            )}
          </div>

          <h2 className="font-bold text-2xl mb-2">Last Update</h2>
          <div className="flex items-center">
            <Image
              src="/clock.svg"
              alt="Clock"
              width={24}
              height={24}
              className="filterwhite mr-1.5"
            />{" "}
            {doc ? getAgo(new Date(doc.$createdAt).getTime()) : "Unavailable"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SongPage;
