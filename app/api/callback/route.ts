import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  if (url.searchParams.has("error")) {
    return NextResponse.json(
      { error: url.searchParams.get("error") },
      { status: 500 }
    );
  }

  const res = await fetch(
    `https://accounts.spotify.com/api/token?code=${url.searchParams.get(
      "code"
    )}&grant_type=authorization_code&redirect_uri=${
      process.env.NEXT_PUBLIC_MAIN_URL
    }/api/callback`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`
        ).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  if (!res.ok) {
    console.log(await res.text());
    return NextResponse.json({ error: "Failed to get token" }, { status: 500 });
  }

  redirect("/?token=" + (await res.json()).access_token);
}
