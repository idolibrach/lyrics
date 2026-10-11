import React from "react";
import AccountDropdown from "./AccountDropdown";
import { User } from "@/types";
import { getClientSafeUser } from "@/utils";

const Navbar = ({ user }: { user?: User }) => {
  return (
    <div className="fixed top-0 left-0 w-full h-16 bg-white/10 px-6 flex justify-between items-center">
      <a className="font-bold text-2xl" href="/">
        Bakbak Lyrics
      </a>
      <div>
        <AccountDropdown user={getClientSafeUser(user)} />
      </div>
    </div>
  );
};

export default Navbar;
