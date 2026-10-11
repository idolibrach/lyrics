import { Models } from "node-appwrite";

export type LoginMethod = "email" | "spotify";

export type User = {
  account: Models.User<Models.Preferences>;
  doc: UserDocument;
};

export interface SongDocument extends Models.Document {
  spotifyId: string;
  lyrics: string;
  users: string[];
}

export type ClientSafeUser = {
  account: {
    email: string;
    name: string;
  };
  doc: {
    loginMethod: LoginMethod;
    spotify: boolean;
  };
};

export enum Role {
  User = "user",
  Contributor = "contributor",
  Expert = "expert",
  Admin = "admin",
}

export interface UserDocument extends Models.Document {
  loginMethod: LoginMethod;
  spotify?: string | null;
  role: Role;
  name: string;
}

export interface MiscDocument extends Models.Document {
  spotifyToken?: string;
}

export type SpotifyCreds = {
  accessToken: string;
  refreshToken: string;
  expires: number;
};
