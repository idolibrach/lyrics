import React from "react";
import Link from "next/link";
import Login from "./Login";
import Signup from "./Signup";
import Separator from "../components/Separator";
import { getAccount } from "@/appwrite";
import { redirect } from "next/navigation";

const LoginPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) => {
  const account = await getAccount();
  if (account) redirect("/");
  return (
    <div className="fixed top-0 left-0 w-full h-full z-20 flex justify-center items-center bg-black text-white">
      <div className="flex-col flex items-center">
        <h1 className="text-3xl font-bold mb-5 text-center">
          {searchParams.signup
            ? "Create an Account"
            : "Welcome to BakbakLyrics"}
        </h1>
        {searchParams.signup ? <Signup /> : <Login />}
        <div className="mb-8"></div>
        <Separator text="or" />
        <Link href="/login/oauth2/spotify" className="w-full">
          <button className="py-2  px-4 rounded-3xl w-full mt-8 font-medium text-[1.3rem] disabled:text-black/40 border-white/40 border-[1px] relative">
            Continue with Spotify
            <div className="absolute left-0 top-0 h-full flex items-center pl-3">
              <img src="/spotify.png" alt="" className="w-8" />
            </div>
          </button>
        </Link>
        <div className="mt-4">
          {searchParams.signup
            ? "Already have an account?"
            : "Don't have an account?"}{" "}
          <Link
            href={searchParams.signup ? "/login" : "/login?signup=true"}
            className="text-green-600 underline"
          >
            {searchParams.signup ? "Log in" : "Sign up"}
          </Link>
        </div>
        {!searchParams.signup && (
          <Link href="/login/reset" className="text-green-600 underline">
            Forgot password?
          </Link>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
