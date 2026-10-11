import { getUsersInfo } from "@/appwrite";
import { Role } from "@/types";
import React from "react";

// const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const Contributors = async ({ users }: { users: string[] }) => {
  const usersData = await getUsersInfo(users);

  if (!usersData) return "FATAL ERROR";

  return (
    <>
      {users.map((u, i) => {
        let role = usersData[u].role;
        return (
          <div key={i} className="flex items-center mt-2">
            {role !== Role.User && (
              <div
                className={`${
                  role === Role.Admin
                    ? "bg-red-400"
                    : role === Role.Expert
                    ? "bg-yellow-400"
                    : "bg-green-400"
                } px-2 py-0.5 rounded-full mr-2 text-black font-bold`}
              >
                {role === Role.Admin
                  ? "ADMIN"
                  : role === Role.Expert
                  ? "EXPERT"
                  : "CONTRIBUTOR"}
              </div>
            )}

            <div>{usersData[u].name}</div>
          </div>
        );
      })}
    </>
  );
};

export default Contributors;
