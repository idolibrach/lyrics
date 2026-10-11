import { useEffect, useRef, useState } from "react";
import { Lyrics, VoiceType, Word } from "./page";
import { syllabify } from "./syllable";

function splitToSections(input: string) {
  const regex = /(\s+|~|-)/g;
  let parts = input.split(regex).filter((part) => part !== "");
  const result = [];
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].match(/\s/)) {
      result[result.length - 1] += parts[i];
    } else if (parts[i] === "~" || parts[i] === "-") {
      if (i + 1 < parts.length) {
        parts[i + 1] = parts[i] + parts[i + 1];
      } else {
        result.push(parts[i]);
      }
    } else {
      result.push(parts[i]);
    }
  }

  return result;
}

function textToLyrics(text: string) {
  let lines = text.split("\n");
  let lyrics: Lyrics = { lines: [], types: [] };
  for (const line of lines) {
    let words = line.split(" ");
    let wordsList = [];
    for (const word of words) {
      let parts = splitToSections(word);
      let wordObj: Word = {
        type: "lead",
        index: wordsList.length,
        parts: parts.map((part) => {
          return {
            text: part.replaceAll("~", ""),
            time: null,
          };
        }),
      };
      wordsList.push(wordObj);
    }

    lyrics.lines.push({
      before: [],
      line: wordsList,
      after: [],
      duet: [],
      index: lyrics.lines.length,
    });
  }
  return lyrics;
}

function capitalizeFirstLetter(input: string): string {
  if (input.length === 0) return input;

  let firstLetterIndex = -1;

  // Find the first lowercase English letter in the string
  for (let i = 0; i < input.length; i++) {
    if (input[i] >= "A" && input[i] <= "Z") {
      return input;
    }
    if (input[i] >= "a" && input[i] <= "z") {
      firstLetterIndex = i;
      break;
    }
  }

  // If no lowercase English letter is found, return the input as is
  if (firstLetterIndex === -1) return input;

  const capitalizedChar = input[firstLetterIndex].toUpperCase();
  return (
    input.slice(0, firstLetterIndex) +
    capitalizedChar +
    input.slice(firstLetterIndex + 1)
  );
}

// TODO: Fix this function
function removeParentheses(
  firstString: string,
  secondString: string
): [string, string] {
  let newFirstString = firstString;
  let newSecondString = secondString;

  if (firstString.startsWith("(")) {
    newFirstString = firstString.slice(1);
  }

  if (secondString.endsWith(")")) {
    newSecondString = secondString.slice(0, -1);
  }

  return [newFirstString, newSecondString];
}

function fixupLyrics2(lyrics: Lyrics | null) {
  if (lyrics === null) {
    console.log("Lyrics is null");
    return;
  }
  for (const line of lyrics.lines) {
    const firstWord = line.line[0];
    for (const word of line.line) {
      if (word.type !== "background") continue;
      for (const part of word.parts) {
        part.text = part.text.replaceAll("(", "");
        part.text = part.text.replaceAll(")", "");
      }
    }
    if (firstWord.parts.length > 0)
      firstWord.parts[0].text = capitalizeFirstLetter(firstWord.parts[0].text);
  }
  // console.log(lyrics);
}

function getLyricsOfVocal(lyrics: Lyrics, vocal: VoiceType) {
  if (!lyrics.types.includes(vocal)) {
    console.log("Vocal type not found");
    return null;
  }
  let l: Lyrics = {
    lines: [],
    types: [vocal],
  };

  for (const line of lyrics.lines) {
    let words = [];
    for (const word of line.line) {
      if (word.type === vocal) {
        words.push(word);
      }
    }

    if (words.length > 0) {
      l.lines.push({
        before: [],
        line: words,
        after: [],
        duet: [],
        index: line.index,
      });
    }
  }

  return l;
}

function fixupLyrics(lyrics: Lyrics) {
  for (let line of lyrics.lines) {
    for (let word of line.line) {
      if (lyrics.types.includes(word.type)) continue;
      lyrics.types.push(word.type);
    }
  }

  fixupLyrics2(getLyricsOfVocal(lyrics, "lead"));
  fixupLyrics2(getLyricsOfVocal(lyrics, "background"));
  fixupLyrics2(getLyricsOfVocal(lyrics, "duet"));

  // console.log(lyrics);
  return lyrics;
}

export const ImportLyrics = ({ done }: { done: any }) => {
  const [step, setStep] = useState(1);
  const [rawLyrics, setRawLyrics] = useState<string>("");
  const [lyrics, setLyrics] = useState<Lyrics | null>(null);
  const [brush, setBrush] = useState<VoiceType>("lead");

  const mouseDown = useRef(false);
  const voicedLyrics = useRef<Lyrics | null>(null);

  useEffect(() => {
    document.addEventListener("mousedown", () => {
      mouseDown.current = true;
    });
    document.addEventListener("mouseup", () => {
      mouseDown.current = false;
    });
  }, []);

  return (
    <div className="bg-white w-[40%] min-w-[800px] h-[90%] rounded-lg text-center text-black relative overflow-hidden">
      <div
        className="w-full flex h-full absolute top-0 duration-1000"
        style={{
          left: step === 1 ? "0" : step === 2 || step === 3 ? "-100%" : "-200%",
        }}
      >
        <div className="w-full min-w-full h-full flex-col relative flex">
          <h1 className="text-3xl font-bold p-4">Step 1 - Import Lyrics</h1>
          <div className="p-4 flex-1">
            <textarea
              value={rawLyrics}
              onChange={(e) => setRawLyrics(e.target.value)}
              className="w-full h-full bg-black/5 rounded-lg p-4 resize-none text-xl font-medium"
              placeholder="Paste/write lyrics here"
            ></textarea>
          </div>
        </div>
        <div className="w-full min-w-full h-full flex-col relative flex">
          <h1 className="text-3xl font-bold p-4">Step 2 - Syllables</h1>
          <div className="p-4 flex-1">
            <textarea
              value={rawLyrics}
              disabled={step === 2}
              onChange={(e) => setRawLyrics(e.target.value)}
              className="w-full h-full bg-black/5 rounded-lg p-4 resize-none text-xl font-medium"
              placeholder="Paste/write syllabified lyrics here"
            ></textarea>
          </div>
        </div>
        <div className="w-full min-w-full h-full flex-col relative flex">
          <h1 className="text-3xl font-bold p-4">Step 3 - Separate Voices</h1>
          <div className="flex justify-center mb-2">
            <div
              onClick={() => setBrush("lead")}
              className={`${
                brush === "lead"
                  ? "bg-black text-white cursor-default"
                  : "bg-black/20 hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 active:shadow-none hover:shadow-md cursor-pointer"
              } rounded-md px-4 py-1 text-xl font-medium mx-1 duration-150`}
            >
              Lead
            </div>
            <div
              onClick={() => setBrush("background")}
              className={`${
                brush === "background"
                  ? "bg-sky-400 cursor-default"
                  : "bg-sky-400/30 hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 active:shadow-none hover:shadow-md cursor-pointer"
              } rounded-md px-4 py-1 text-xl font-medium mx-1 duration-150`}
            >
              Background
            </div>
            <div
              onClick={() => setBrush("duet")}
              className={`${
                brush === "duet"
                  ? "bg-fuchsia-500 cursor-default"
                  : "bg-fuchsia-500/40 hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 active:shadow-none hover:shadow-md cursor-pointer"
              } rounded-md px-4 py-1 text-xl font-medium mx-1 duration-150`}
            >
              Duet
            </div>
          </div>
          <div className="p-4 px-12 pt-0 flex-1 overflow-y-auto select-none">
            {lyrics &&
              lyrics.lines.map((line, lineIndex) => (
                <div
                  key={lineIndex}
                  className="flex justify-center my-2 flex-wrap"
                >
                  {line.line.map((_, wordIndex) => (
                    <WordComponent
                      line={lineIndex}
                      wordIndex={wordIndex}
                      mouseDown={mouseDown}
                      brush={brush}
                      key={wordIndex}
                      voicedLyrics={voicedLyrics}
                    />
                  ))}
                </div>
              ))}
          </div>
        </div>
      </div>

      <button
        className="absolute right-4 top-4 bg-black text-white px-4 py-2 rounded-lg text-xl font-medium enabled:hover:shadow-md enabled:hover:shadow-black/50 duration-150 enabled:hover:-translate-x-0.5 enabled:hover:-translate-y-0.5 enabled:active:translate-x-0 enabled:active:translate-y-0 enabled:active:shadow-none disabled:opacity-50"
        disabled={
          step === 1 || step === 2 || step === 3
            ? rawLyrics.length === 0
            : false
        }
        onClick={async () => {
          if (step === 1) {
            setStep(2);
            let syllabified = await syllabify(rawLyrics);
            setRawLyrics(syllabified);
            setStep(3);
          } else if (step === 3) {
            let l = textToLyrics(rawLyrics);
            voicedLyrics.current = l;
            setLyrics(l);
            setStep(4);
          } else if (step === 4) {
            done(fixupLyrics(voicedLyrics.current!));
          }
        }}
      >
        {step === 4 ? "Finish" : "Next"}
      </button>
    </div>
  );
};

const WordComponent = ({
  mouseDown,
  line,
  wordIndex,
  brush,
  voicedLyrics,
}: {
  mouseDown: any;
  line: number;
  wordIndex: number;
  brush: VoiceType;
  voicedLyrics: React.MutableRefObject<Lyrics | null>;
}) => {
  const [mode, setMode] = useState<VoiceType>("lead");

  const word = voicedLyrics.current!.lines[line].line[wordIndex];

  function set() {
    setMode(brush);
    voicedLyrics.current!.lines[line].line[wordIndex].type = brush;
  }

  return (
    <div
      onMouseMove={() => {
        if (mouseDown.current) {
          set();
        }
      }}
      onClick={() => {
        set();
      }}
      className={`px-[2px] rounded-md m-[1px] text-xl font-medium ${
        mode !== brush
          ? brush === "lead"
            ? "hover:bg-black/20 hover:-translate-y-[1px]"
            : brush === "background"
            ? "hover:bg-sky-400/30 hover:-translate-y-[1px]"
            : "hover:bg-fuchsia-500/40 hover:-translate-y-[1px]"
          : null
      } ${
        mode === "lead"
          ? ""
          : mode === "background"
          ? "bg-sky-400"
          : "bg-fuchsia-500"
      } ${word.parts.length === 0 ? "opacity-0 my-1" : "duration-150"}`}
    >
      {word.parts.map((part, partIndex) => (
        <span key={partIndex}>{part.text}</span>
      ))}
    </div>
  );
};
