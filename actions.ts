"use server";
import { errorMessages } from "@/utils";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createJWT,
  createRecovery,
  disconnectSpotify,
  getSongInfo,
  getSpotifyToken,
  getUserSpotifyToken,
  loginWithEmailAndPassword,
  populateSearchResults,
  signOut,
  signupWithEmailAndPassword,
  updateRecovery,
  uploadLyrics,
} from "./appwrite";

export async function login(state: any, formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");
  if (typeof email !== "string" || typeof password !== "string") return { error: "Invalid email or password" };
  const res = await loginWithEmailAndPassword(email, password);
  if (res.success) {
    return redirect("/");
  } else {
    return { error: errorMessages[res.type!] || res.type };
  }
}

export async function getSpotifyTokenAction() {
  return await getUserSpotifyToken(10);
}

export async function searchSongAction(s: string, dbSearch: boolean = false) {
  try {
    const token = await getSpotifyToken();
    const res = await fetch(`https://api.spotify.com/v1/search?q=${s}&type=track&limit=5`, {
      headers: {
        Authorization: "Bearer " + token,
      },
    });
    console.log(res.status);
    if (!res.ok) return null;
    let json = await res.json();
    if (dbSearch) {
      return populateSearchResults(json);
    }
    return json;
  } catch {
    return null;
  }
}

export async function getLyrics(id: string) {
  const doc = await getSongInfo(id);
  if (!doc) return null;
  return JSON.parse(doc.lyrics);
}

export async function disconnectSpotifyAction() {
  const e = await disconnectSpotify();
  console.log(e);
  return e;
}

export async function uploadLyricsAction(spotifyId: string, lyrics: any) {
  try {
    const token = await getSpotifyToken();
    const sres = await fetch("https://api.spotify.com/v1/tracks/" + spotifyId, {
      headers: {
        Authorization: "Bearer " + token,
      },
    });
    const track = await sres.json();
    const res = await uploadLyrics(track.external_ids.isrc, spotifyId, lyrics);
    revalidatePath("/song/" + track.external_ids.isrc);
    return { ...res, isrc: track.external_ids.isrc };
  } catch {
    return { success: false, isrc: null, type: null };
  }
}

export async function createJWTAction() {
  return await createJWT();
}

export async function logout() {
  await signOut();
  redirect("/login");
}

export async function signup(
  state: any, // { email: string | null; pass: string | null; cpass: string | null },
  formData: FormData
) {
  const email = formData.get("email");
  const password = formData.get("password");
  const cpassword = formData.get("cpassword");
  if (typeof email !== "string" || typeof password !== "string" || typeof cpassword !== "string") return { email: "Invalid credentials", pass: "", cpass: "" };
  if (password !== cpassword) return { email: null, pass: null, cpass: "Passwords do not match" };
  const res = await signupWithEmailAndPassword(email, password);
  if (res.success) {
    redirect("/");
  } else {
    if (res.type === "user_already_exists") {
      return {
        email: errorMessages[res.type] || res.type,
        pass: null,
        cpass: null,
      };
    } else if (res.type == "general_argument_invalid") {
      return {
        email: null,
        pass: errorMessages[res.type] || res.type,
        cpass: null,
      };
    }
    return {
      email: errorMessages[res.type!] || res.type!,
      pass: "",
      cpass: "",
    };
  }
}

export async function forgotPassword(state: { state: string }, formData: FormData) {
  const email = formData.get("email");
  if (typeof email !== "string") return { state: "error" };
  try {
    const res = await createRecovery(email);
    return { state: res ? "success" : "error" };
  } catch {
    return { state: "error" };
  }
}

export async function forgotPasswordConfirm(state: { state: string }, formData: FormData) {
  const password = formData.get("password") as string;
  const cpassword = formData.get("cpassword") as string;
  const userId = formData.get("userId") as string;
  const secret = formData.get("secret") as string;
  if (!password || !cpassword || !userId || !secret) return { state: "Please fill out every field" };
  if (password !== cpassword) return { state: "Password do not match" };
  try {
    const res = await updateRecovery(userId, secret, password);
    if (!res.success) {
      return {
        state: errorMessages[res.message!] || "Couldn't update password",
      };
    }
    redirect("/login");
  } catch {
    return { state: "Couldn't update password" };
  }
}
