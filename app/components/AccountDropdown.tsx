"use client";
import { disconnectSpotifyAction, logout } from "@/actions";
import { ClientSafeUser } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";

const AccountDropdown = ({ user }: { user?: ClientSafeUser }) => {
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const menu = useRef<HTMLDivElement>(null);
  const premium = false;

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (open && !menu.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("click", handle);

    return () => {
      document.removeEventListener("click", handle);
    };
  }, [open]);

  return (
    <div>
      {user ? (
        <div className="w-10 h-10 rounded-full bg-white relative flex items-center justify-center cursor-pointer">
          <Image
            src="/user.svg"
            alt="User"
            fill={true}
            className="p-1"
            onClick={() => {
              setOpen(!open);
            }}
          />{" "}
          {/* Remove padding if user has profile pic */}
          <AnimatePresence>
            {open && (
              <motion.div
                transition={{ duration: 0.15 }}
                initial={{ opacity: 0, bottom: "0.5rem" }}
                animate={{ opacity: 1, bottom: "-0.5rem" }}
                exit={{ opacity: 0, bottom: "-0.25rem" }}
                ref={menu}
                className={`absolute -bottom-2 shadow right-0 translate-y-full w-[350px] py-6 bg-white rounded-md flex flex-col items-center text-black cursor-auto`}
              >
                <div className="w-16 h-16 bg-black/20 flex items-center justify-center rounded-full relative">
                  <Image
                    src="/user.svg"
                    alt="User"
                    fill={true}
                    className="p-2"
                  />
                  {/* Remove padding if user has profile pic */}
                </div>
                <div className="flex items-center text-2xl font-medium mt-2 ">
                  {user.doc.loginMethod === "spotify" && (
                    <div className="relative mr-2 before:content-['Logged_in_with_Spotify'] before:absolute before:left-1/2 before:-translate-y-full before:-translate-x-1/2 before:text-base before:pointer-events-none before:bg-green-400 before:px-3 before:py-0.5 before:rounded-full before:text-nowrap before:duration-150 before:opacity-0 hover:before:opacity-100 before:top-0 hover:before:-top-1">
                      <div className="w-[20px] h-[20px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black rounded-full -z-10"></div>
                      <Image
                        src="/spotify.png"
                        alt="Spotify Logo"
                        height={24}
                        width={24}
                      />
                    </div>
                  )}
                  <div>
                    {user.account.name.length === 0
                      ? user.account.email.split("@")[0]
                      : user.account.name}
                  </div>
                </div>
                <div
                  className={`${
                    premium ? "bg-[#ffbf00]" : "bg-black/10"
                  } rounded-full px-3 py-1 mt-2`}
                >
                  {premium ? "Premium" : "Free plan"}
                </div>
                <div className="w-full bg-green-400/10 hover:bg-green-400/15 h-14 border-y-[1px] border-solid border-black/20 mt-8 flex items-center justify-between pl-4 pr-2 text-xl font-medium cursor-default ">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <div className="w-[28px] h-[28px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black rounded-full"></div>
                      <Image
                        src="/spotify.png"
                        alt="Spotify Logo"
                        height={32}
                        width={32}
                        className="relative z-20"
                      />
                    </div>
                    {user.doc.spotify ? "Connected" : "Not connected"}
                  </div>
                  {user.doc.spotify ? (
                    <button
                      disabled={user.doc.loginMethod === "spotify" || loading}
                      onClick={async () => {
                        setLoading(true);
                        await disconnectSpotifyAction();
                        setLoading(false);
                        router.refresh();
                      }}
                      className={`relative bg-[#f00] disabled:bg-gray-300 rounded-full px-4 py-1 duration-300 enabled:hover:-translate-x-[1px] enabled:hover:-translate-y-[1px] enabled:hover:shadow enabled:hover:shadow-red-400 ${
                        user.doc.loginMethod === "spotify"
                          ? `before:text-wrap before:content-['Can\\'t_disconnect_Spotify_because_it\\'s_your_login_method'] before:w-[275px] before:absolute before:-translate-y-full before:-translate-x-1/2 before:text-base before:pointer-events-none before:bg-green-400 before:px-3 before:py-0.5 before:rounded-3xl before:duration-150 before:opacity-0 hover:before:opacity-100 before:top-0 hover:before:-top-1`
                          : ""
                      }`}
                    >
                      Disconnect
                    </button>
                  ) : (
                    <Link href="/login/oauth2/spotify">
                      <button
                        className={`bg-green-400 rounded-full px-4 py-1 duration-300 hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow hover:shadow-green-300`}
                      >
                        Connect
                      </button>
                    </Link>
                  )}
                </div>
                <button
                  className="bg-black text-white px-3 py-1 rounded-md text-xl font-medium enabled:hover:bg-black/70 duration-300 mt-6 disabled:bg-black/30"
                  disabled={loggingOut}
                  onClick={async () => {
                    setLoggingOut(true);
                    await logout();
                    setLoggingOut(false);
                  }}
                >
                  Log out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <a href="/login">
          <div className="bg-white text-black px-4 py-1 rounded-md cursor-pointer text-xl font-medium hover:bg-white/80 duration-300">
            Login
          </div>
        </a>
      )}
    </div>
  );
};

export default AccountDropdown;
