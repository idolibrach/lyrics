import Link from "next/link";
import React from "react";

const NotFound = () => {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center">
      <div className="flex flex-col items-center">
        <h1 className="text-7xl font-bold">404</h1>
        <h2 className="text-xl">Sorry, page not found</h2>
        <Link href="/" className="flex flex-col items-center mt-5">
          <button className="bg-green-400 text-black py-2 px-6 rounded-3xl w-full font-medium text-[1.3rem] enabled:hover:w-[110%] duration-200 disabled:text-black/40">
            Return home
          </button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
