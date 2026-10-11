import { connectSpotify, getAccount, getAdminClient, loginWithSpotify, setSession, signupWithSpotify } from "@/appwrite";
import { UserDocument } from "@/types";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";
import { Account, Databases, Query, Users } from "node-appwrite";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  if (!code) return redirect("/login?error=no_code");

  const res = await fetch(
    `https://accounts.spotify.com/api/token?code=${url.searchParams.get("code")}&grant_type=authorization_code&redirect_uri=${
      process.env.NEXT_PUBLIC_MAIN_URL
    }/login/oauth2/callback`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      cache: "no-store",
    }
  );

  const data = await res.json();
  console.log(JSON.stringify(data));
  console.log(`${process.env.NEXT_PUBLIC_MAIN_URL}/login/oauth2/callback`);
  let returnedScopes = data.scope.split(" ");
  for (const scope of process.env.SCOPES!.split(" ")) {
    if (!returnedScopes.includes(scope)) {
      return NextResponse.json({ error: "Missing scope" }, { status: 400 });
    }
  }

  const account = await getAccount();
  if (account) {
    // Connect spotify instead of log in with spotify
    const success = await connectSpotify(data.access_token, data.refresh_token);
    if (success) {
      return redirect("/");
    } else {
      return redirect("/login?error=spotify_connection_failed");
    }
  }

  const spotifyData = await (
    await fetch("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${data.access_token}`,
      },
    })
  ).json();

  const email = spotifyData.email;

  const client = getAdminClient();
  const users = new Users(client);
  const databases = new Databases(client);

  const foundUser = (await users.list([Query.equal("email", email)])).users[0];
  if (foundUser) {
    if (((await databases.getDocument("main", "users", foundUser.$id)) as UserDocument).loginMethod !== "spotify") {
      return redirect("/login?error=spotify_email_exists");
    }
    // Log in
    const loginRes = await loginWithSpotify(email, data.refresh_token, data.access_token, true);
    if (!loginRes.success) {
      return redirect("/login?error=spotify_login_failed");
    } else {
      return redirect("/");
    }
  } else {
    const signupRes = await signupWithSpotify(email, data.refresh_token, data.access_token);
    if (!signupRes.success) {
      return redirect("/login?error=spotify_login_failed");
    } else {
      return redirect("/");
    }
  }
}
