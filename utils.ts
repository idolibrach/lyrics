import { Lyrics, VoiceType, Word } from "./app/editor/page";
import { ClientSafeUser, User } from "./types";

export const validateEmail = (email: string) => {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
};

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const parseDate = (s: string) => {
  let b = s.split(/\D/);
  // @ts-ignore
  return new Date(b[0], b[1] - 1, b[2], b[3], b[4], b[5]);
};

export const errorMessages: { [key: string]: string } = {
  user_invalid_credentials: "Email and password do not match",
  user_already_exists: "Email already in use",
  general_argument_invalid: "Password must be at least 8 characters long",
  user_invalid_token: "Please request a new link",
  user_not_found: "Couldn't find account",
  oauth2_spotify: "Please log in with Spotify",
};

export function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export function getClientSafeUser(user?: User): ClientSafeUser | undefined {
  if (!user) return undefined;
  return {
    account: {
      email: user.account.email,
      name: user.account.name,
    },
    doc: {
      loginMethod: user.doc.loginMethod,
      spotify: user.doc.spotify ? true : false,
    },
  };
}

function setEndTimes(line: Word[]) {
  for (let i = 0; i < line.length; i++) {
    const word = line[i];
    for (let j = 0; j < word.parts.length; j++) {
      const part = word.parts[j];
      if (part.endTime) continue;
      if (j === word.parts.length - 1) {
        if (i === line.length - 1) {
          part.endTime = part.time! + 400;
        } else {
          part.endTime = line[i + 1].parts[0].time!;
        }
      } else {
        part.endTime = word.parts[j + 1].time!;
      }
    }
  }
}

export function getPlayerReadyLyrics(lyrics: Lyrics) {
  let lineIndex = 0;
  for (const line of lyrics.lines) {
    let leadIndex = 0;
    let types: VoiceType[] = [];
    let backgroundBefore = false;
    let toRemove = [];
    line.index = lineIndex;
    for (let i = 0; i < line.line.length; i++) {
      const word = line.line[i];
      if (word.parts.length === 0) {
        lineIndex--;
        continue;
      }
      if (!types.includes(word.type)) types.push(word.type);
      if (word.type === "lead") {
        word.index = leadIndex;
      } else {
        leadIndex--;
        if (word.type === "background") {
          if (i === 0) backgroundBefore = true;
          if (backgroundBefore) {
            word.index = line.before.length;
            line.before.push(word);
            toRemove.push(i);
          } else {
            word.index = line.after.length;
            line.after.push(word);
            toRemove.push(i);
          }
        } else {
          if (i === 0) line.duetbefore = true;
          word.index = line.duet.length;
          line.duet.push(word);
          toRemove.push(i);
        }
      }
      leadIndex++;
    }
    if (!types.includes("lead")) {
      line.before = [];
      for (let i = toRemove.length - 1; i >= 0; i--) {
        if (line.line[toRemove[i]].type === "background") {
          toRemove.splice(i, 1);
        }
      }
    }
    for (let i = toRemove.length - 1; i >= 0; i--) {
      line.line.splice(toRemove[i], 1);
    }
    lineIndex++;
  }

  for (let i = lyrics.lines.length - 1; i >= 0; i--) {
    if (lyrics.lines[i].line.length === 0) continue;
    if (lyrics.lines[i].line[0].parts.length === 0) {
      lyrics.lines.splice(i, 1);
    }
  }

  for (const line of lyrics.lines) {
    setEndTimes(line.line);
    setEndTimes(line.before);
    setEndTimes(line.after);
    setEndTimes(line.duet);

    let max = 0;
    let min = Math.min(
      Math.min(
        line.line[0] ? line.line[0].parts[0].time! : Infinity,
        line.before[0] ? line.before[0].parts[0].time! : Infinity
      ),
      Math.min(
        line.after[0] ? line.after[0].parts[0].time! : Infinity,
        line.duet[0] ? line.duet[0].parts[0].time! : Infinity
      )
    );
    for (const word of line.line) {
      for (const part of word.parts) {
        if (part.endTime! > max) max = part.endTime!;
      }
    }
    for (const word of line.after) {
      for (const part of word.parts) {
        if (part.endTime! > max) max = part.endTime!;
      }
    }
    for (const word of line.before) {
      for (const part of word.parts) {
        if (part.endTime! > max) max = part.endTime!;
      }
    }
    for (const word of line.duet) {
      for (const part of word.parts) {
        if (part.endTime! > max) max = part.endTime!;
      }
    }

    line.start = min;
    line.end = max;
  }

  return lyrics;
}
