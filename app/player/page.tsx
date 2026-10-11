import { getAccount } from "@/appwrite";
import { redirect } from "next/navigation";
import React from "react";
import Player from "./Player";

const PlayerPage = async () => {
  const account = await getAccount();
  if (!account) redirect("/login");
  return (
    <div className="fixed top-0 left-0 w-full h-full bg-black z-10">
      <Player initialSong="1n7xFAY4xoPeqRvrkzAtsw" />
    </div>
  );
};

export default PlayerPage;
