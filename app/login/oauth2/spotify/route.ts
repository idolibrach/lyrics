import { redirect } from "next/navigation";

export async function GET(req: Request) {
  return redirect(
    `https://accounts.spotify.com/authorize?response_type=code&client_id=${process.env.CLIENT_ID}&scope=${process.env.SCOPES}&redirect_uri=${process.env.NEXT_PUBLIC_MAIN_URL}/login/oauth2/callback`
  );
}
