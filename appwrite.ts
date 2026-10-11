import "server-only";
import { cookies } from "next/headers";
import { Account, AppwriteException, Client, Databases, ID, Query, Users } from "node-appwrite";
import { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { MiscDocument, Role, SongDocument, SpotifyCreds, User, UserDocument } from "./types";

export function getAdminClient() {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!)
    .setKey(process.env.APPWRITE_API_KEY!);
  return client;
}

export function getClient() {
  const client = new Client().setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!).setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!);
  const session = cookies().get(process.env.AUTH_COOKIE!);
  if (session) {
    client.setSession(session.value);
  }
  return client;
}

export async function uploadLyrics(id: string, spotifyId: string, lyrics: any) {
  const account = await getAccount();
  if (!account) return { success: false, type: "not_logged_in" };
  const databases = new Databases(getAdminClient());
  try {
    await databases.createDocument("main", "songs", id, {
      spotifyId: spotifyId,
      lyrics: JSON.stringify(lyrics),
      users: [account.$id],
    } as SongDocument);
    return { success: true };
  } catch (e) {
    if (e instanceof AppwriteException) {
      // @ts-ignore
      return { success: false, type: e.type };
    }
    return { success: false, type: "unknown" };
  }
}

export async function getSongInfo(id: string) {
  try {
    const databases = new Databases(getAdminClient());
    const doc = (await databases.getDocument("main", "songs", id)) as SongDocument;
    return doc;
  } catch {
    return null;
  }
}

export async function getSong(id: string) {
  let song;
  try {
    const spotifyToken = await getSpotifyToken();
    const res = await fetch(`https://api.spotify.com/v1/search?type=track&limit=5&q=isrc:${id}`, {
      headers: {
        Authorization: `Bearer ${spotifyToken}`,
      },
      cache: "no-store",
    });
    if (!res.ok) return { success: false, type: "song_not_found_spotify" };
    song = await res.json();
    if (song.tracks.total === 0) return { success: false, type: "song_not_found_spotify" };

    const doc = await getSongInfo(id);
    return { success: true, song: song.tracks.items[0], doc: doc };
  } catch (e) {
    if (e instanceof AppwriteException) {
      if (song) {
        if (song.tracks.total === 0) return { success: false, type: "song_not_found_spotify" };
        return { success: true, song: song.tracks.items[0], doc: null };
      }
      return { success: false, type: e.type };
    }
    return { success: false, type: "unknown" };
  }
}

export async function populateSearchResults(data: any) {
  const databases = new Databases(getAdminClient());
  const res = await databases.listDocuments("main", "songs", [
    Query.equal(
      "$id",
      data.tracks.items.map((t: any) => t.external_ids.isrc)
    ),
    Query.limit(data.tracks.items.length),
    Query.select(["$id"]),
  ]);

  const dataCopy = { ...data };
  dataCopy.tracks.items = data.tracks.items.map((t: any) => {
    const doc = res.documents.find((d) => d.$id === t.external_ids.isrc);
    return {
      ...t,
      existsInDB: doc ? true : false,
    };
  });

  return dataCopy;
  // return data.tracks.items.map((t: any) => {
  //   return {
  //     name: t.name,
  //     artists: t.artists.map((a: any) => a.name),
  //     albumArt: t.album.images[2].url,
  //     id: t.external_ids.isrc,
  //     explicit: t.explicit,
  //     spotifyId: t.id,
  //   };
  // });
}

export async function getUserSpotifyToken(minMinutes: number) {
  const user = await getUser();
  if (!user) return null;
  if (!user.doc.spotify) return null;
  try {
    const creds = JSON.parse(user.doc.spotify!) as SpotifyCreds;
    if (creds.expires < Date.now() + minMinutes * 60 * 1000) {
      const res = await fetch(`https://accounts.spotify.com/api/token?grant_type=refresh_token&refresh_token=${creds.refreshToken}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(`${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`).toString("base64")}`,
        },
      });
      const data = await res.json();
      await connectSpotify(data.access_token, creds.refreshToken);
      return data.access_token;
    } else {
      return creds.accessToken;
    }
  } catch {
    return false;
  }
}

export async function getUsersInfo(ids: string[]) {
  try {
    const databases = new Databases(getAdminClient());
    const res = await databases.listDocuments("main", "users", [Query.equal("$id", ids), Query.limit(ids.length), Query.select(["name", "role", "$id"])]);
    const data: { [id: string]: UserDocument } = {};
    for (const doc of res.documents) {
      data[doc.$id] = doc as UserDocument;
    }
    return data;
  } catch (E) {
    console.log(E);
    return null;
  }
}

export async function getSpotifyToken() {
  const databases = new Databases(getAdminClient());
  const doc = (await databases.getDocument("main", "misc", "misc")) as MiscDocument;
  const data = doc.spotifyToken ? (JSON.parse(doc.spotifyToken) as { token: string; expires: number }) : null;
  if (!data || Date.now() >= data.expires) {
    console.log("GENERATING NEW GLOBAL SPOTIFY TOKEN");
    const res = await fetch(`https://accounts.spotify.com/api/token?grant_type=client_credentials`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      cache: "no-store",
    });

    const data = await res.json();
    await databases.updateDocument("main", "misc", "misc", {
      spotifyToken: JSON.stringify({
        token: data.access_token,
        expires: Date.now() + data.expires_in * 1000,
      }),
    } as MiscDocument);

    return data.access_token;
  }

  return data.token;
}

export async function createJWT() {
  const client = getClient();
  const account = new Account(client);
  try {
    const { jwt } = await account.createJWT();
    return jwt;
  } catch {
    return null;
  }
}

export async function signOut() {
  const client = getClient();
  const account = new Account(client);
  await account.deleteSession("current");
  cookies().delete(process.env.AUTH_COOKIE!);
}

export async function getAccount() {
  const client = getClient();
  const account = new Account(client);
  try {
    return await account.get();
  } catch (e) {
    return null;
  }
}

export async function setSession(secret: string) {
  let o: Partial<ResponseCookie> = {
    httpOnly: true,
    secure: false, // TODO SET TO TRUE?? MAYBE??
    sameSite: "lax", // SET TO LAX IF OAUTH2 LOGIN REDIRECTS TO LOGIN PAGE (old: strict)
    path: "/",
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
  };
  if (process.env.NODE_ENV !== "development") {
    o["domain"] = process.env.DOMAIN_WITH_DOT!;
  }
  cookies().set(process.env.AUTH_COOKIE!, secret, o);
}

export async function connectSpotify(accessToken: string, refreshToken: string) {
  const account = await getAccount();
  if (!account) return false;
  const databases = new Databases(getAdminClient());
  try {
    await databases.updateDocument("main", "users", account.$id, {
      spotify: JSON.stringify({
        accessToken: accessToken,
        refreshToken: refreshToken,
        expires: Date.now() + 1000 * 3600,
      } as SpotifyCreds),
    } as UserDocument);
    return true;
  } catch {
    return false;
  }
}

export async function disconnectSpotify() {
  const account = await getAccount();
  if (!account) return false;
  const databases = new Databases(getAdminClient());
  try {
    await databases.updateDocument("main", "users", account.$id, {
      spotify: null,
    } as UserDocument);
    return true;
  } catch {
    return false;
  }
}

export async function loginWithSpotify(email: string, refreshToken: string, accessToken: string, update: boolean) {
  const client = getAdminClient();
  const account = new Account(client);
  const databases = new Databases(client);
  try {
    const session = await account.createEmailPasswordSession(email, process.env.SECRET_SPOTIFY_LOGIN_PASSWORD!);
    if (update) {
      await databases.updateDocument("main", "users", session.userId, {
        spotify: JSON.stringify({
          accessToken: accessToken,
          refreshToken: refreshToken,
          expires: Date.now() + 1000 * 3600,
        } as SpotifyCreds),
      } as UserDocument);
    }

    setSession(session.secret);
    return { success: true };
  } catch (e) {
    if (e instanceof AppwriteException) {
      // @ts-ignore
      return { success: false, type: e.type };
    }
    return { success: false, type: "unknown" };
  }
}

export async function loginWithEmailAndPassword(email: string, password: string) {
  const client = getAdminClient();
  const account = new Account(client);
  const users = new Users(client);
  const databases = new Databases(client);
  try {
    const user = (await users.list([Query.equal("email", email)])).users[0];
    if (user) {
      const doc: UserDocument = await databases.getDocument("main", "users", user.$id);
      if (doc.loginMethod !== "email") {
        return { success: false, type: "oauth2_" + doc.loginMethod };
      }
    }
    const session = await account.createEmailPasswordSession(email, password);
    // TODO VERIFY THAT ITS NOT REGISTERED WITH SPOTIFY - DONE!
    setSession(session.secret);
    return { success: true };
  } catch (e) {
    if (e instanceof AppwriteException) {
      // @ts-ignore
      return { success: false, type: e.type };
    }
    return { success: false, type: "unknown" };
  }
}

export async function signupWithSpotify(email: string, refreshToken: string, accessToken: string) {
  const client = getAdminClient();
  const account = new Account(client);
  const databases = new Databases(client);
  try {
    const user = await account.create(ID.unique(), email, process.env.SECRET_SPOTIFY_LOGIN_PASSWORD!);
    await databases.createDocument("main", "users", user.$id, {
      loginMethod: "spotify",
      name: user.email.split("@")[0],
      spotify: JSON.stringify({
        accessToken: accessToken,
        refreshToken: refreshToken,
        expires: Date.now() + 1000 * 3600,
      } as SpotifyCreds),
    } as UserDocument);
    await loginWithSpotify(email, refreshToken, accessToken, false);
    return { success: true };
  } catch (e) {
    if (e instanceof AppwriteException) {
      // @ts-ignore
      return { success: false, type: e.type };
    }
    return { success: false, type: "unknown" };
  }
}

export async function signupWithEmailAndPassword(email: string, password: string) {
  const client = getAdminClient();
  const account = new Account(client);
  const databases = new Databases(client);
  try {
    const user = await account.create(ID.unique(), email, password);
    await databases.createDocument("main", "users", user.$id, {
      loginMethod: "email",
      name: user.email.split("@")[0],
      role: Role.User,
    } as UserDocument);
    await loginWithEmailAndPassword(email, password);
    return { success: true };
  } catch (e) {
    if (e instanceof AppwriteException) {
      // @ts-ignore
      return { success: false, type: e.type };
    }
    return { success: false, type: "unknown" };
  }
}

export async function createRecovery(email: string) {
  const account = new Account(getAdminClient());
  try {
    await account.createRecovery(email, "https://picturedate.live/login/reset/confirm");
    return true;
  } catch {
    return false;
  }
}

export async function updateRecovery(userId: string, secret: string, password: string) {
  const account = new Account(getAdminClient());
  try {
    await account.updateRecovery(userId, secret, password);
    return { success: true };
  } catch (e) {
    if (e instanceof AppwriteException) {
      // @ts-ignore
      return { success: false, message: e.type };
    }
    return { success: false };
  }
}

export async function getUser() {
  const account = await getAccount();
  if (!account) return undefined;
  const databases = new Databases(getAdminClient());
  const doc = (await databases.getDocument("main", "users", account.$id)) as UserDocument;
  return { account, doc } as User;
}
