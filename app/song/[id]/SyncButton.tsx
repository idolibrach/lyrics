"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React from "react";

const SyncButton = ({ id, token }: { id: string; token: string }) => {
  const router = useRouter();
  return (
    <button
      disabled={!token}
      className={`relative bg-green-400 text-5xl font-bold rounded-full px-6 py-4 text-black mt-4 flex items-center ${
        token ? "hover:bg-green-400/80" : "bg-green-400/60 cursor-default"
      } ${
        !token
          ? "before:content-['Please_connect_your_Spotify_account_to_continue'] before:absolute before:left-1/2 before:-translate-y-full before:-translate-x-1/2 before:text-xl before:pointer-events-none before:bg-green-400 before:px-3 before:py-0.5 before:rounded-full before:text-nowrap before:duration-150 before:opacity-0 hover:before:opacity-100 before:top-0 hover:before:-top-2.5"
          : ""
      }`}
      onClick={() => {
        localStorage.setItem("song", id);
        localStorage.setItem("token", token);
        router.push("/editor");
      }}
    >
      <Image
        height={52}
        width={52}
        src="/plus.svg"
        alt="Add sync"
        className=" mr-2.5"
      />
      Sync
    </button>
  );
};

export default SyncButton;
