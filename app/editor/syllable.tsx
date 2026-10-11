"use server";
import { syllable } from "syllable";
import { dictionary as pronounciations } from "cmu-pronouncing-dictionary";
import "server-only";

function syllabifyinternal(e: string, l: number) {
  let t = "aeiouy",
    o = [
      "ai",
      "au",
      "ay",
      "ea",
      "ee",
      "ei",
      "eu",
      "ey",
      "ie",
      "io",
      "oa",
      "oe",
      "oi",
      "oo",
      "ou",
      "oy",
      "ue",
      "ui",
      "uy",
      "ya",
      "ye",
      "yi",
      "yo",
      "yu",
    ],
    u = [],
    n = 0,
    i = 0;
  for (; i < e.length && n < l - 1; ) {
    let s = !1;
    for (let h of o)
      if (
        i + h.length < e.length &&
        e.substr(i, h.length).toLowerCase() === h &&
        i + h.length < e.length - 1
      ) {
        u.push(i + h.length), n++, (i += h.length - 1), (s = !0);
        break;
      }
    if (!s) {
      if (
        t.includes(e[i].toLowerCase()) &&
        i + 1 < e.length &&
        !t.includes(e[i + 1])
      ) {
        let a = i + 1;
        for (; a < e.length && !t.includes(e[a].toLowerCase()); ) a++;
        a - i > 1 ? u.push(a - 1) : u.push(i + 1), n++;
      }
      i++;
    }
  }
  let g = "";
  for (let r = 0; r < e.length; r++) u.includes(r) && (g += "~"), (g += e[r]);
  return g;
}

const defaults = {
  lowercase: false,
  punctuation: false,
};

const extractwords = (string: string, options: any = {}) => {
  options = {
    ...defaults,
    ...options,
  };

  let words;
  if (options.punctuation) {
    words = string.match(/\S+/g) || [];
  } else {
    words = string.match(/[a-zA-Z]+('[a-zA-Z]+)?/g) || [];
  }

  if (options.lowercase) {
    words = words.map((string) => string.toLowerCase());
  }

  return words;
};

const syllables = (str: string) => {
  const wordList = extractwords(str);
  let syllables = 0;

  for (let i = 0; i < wordList.length; i++) {
    let word = wordList[i].toLowerCase();
    let pronounciation = pronounciations[word] || "";
    let stresses = pronounciation.match(/[0-2]/g) || [];
    syllables += stresses.length;
  }

  return syllables;
};

function containsNonEnglish(text: string) {
  return /[^A-Za-z0-9 ,.!?'"-;:@#$%^&*()_+=`~\[\]{}\\|<>/]/.test(text);
}

function splitIntoSyllables(lyrics: string[]) {
  let final = [];
  for (const line of lyrics) {
    let words = [];
    for (const word of line.split(" ")) {
      if (containsNonEnglish(word)) {
        words.push(word);
        continue;
      }
      let parts = [];
      for (const part of word.split("-")) {
        let numSyllables = syllables(part);
        if (numSyllables === 0) numSyllables = syllable(part);
        parts.push(syllabifyinternal(part, numSyllables));
      }
      words.push(parts.join("-"));
    }
    final.push(words.join(" "));
  }
  return final;
}

export async function syllabify(lyrics: string) {
  return splitIntoSyllables(lyrics.split("\n")).join("\n");
}
