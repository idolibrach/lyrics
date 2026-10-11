import { useCallback, useEffect, useRef, useState } from "react";
import { Lyrics, VoiceType } from "./page";
import { motion } from "framer-motion";

export function smoothScrollBy(element: HTMLElement, yDistance: number): void {
  const duration: number = 150; // Duration in milliseconds
  let start: number | null = null;
  const initialScrollPosition: number = element.scrollTop;

  const step = (timestamp: number): void => {
    if (start === null) start = timestamp;
    const elapsed: number = timestamp - start;
    const fraction: number = Math.min(elapsed / duration, 1); // Ensure the fraction is capped at 1

    // Calculate current scroll position using linear easing.
    const currentScroll: number = initialScrollPosition + yDistance * fraction;
    element.scrollTop = currentScroll;

    if (elapsed < duration) {
      // Continue the animation as long as the duration has not been reached
      window.requestAnimationFrame(step);
    }
  };

  window.requestAnimationFrame(step);
}

function getTextColor(
  vocal: VoiceType,
  wordVocal: VoiceType,
  timed: boolean,
  longTimed: boolean
) {
  if (vocal !== wordVocal) {
    if (longTimed) return "text-[#ffbf00]/50";
    if (timed) {
      if (wordVocal === "lead") return "text-green-400/50";
      if (wordVocal === "background") return "text-sky-400/50";
      return "text-fuchsia-500/50";
    }
    if (wordVocal === "lead") return "text-green-400/20";
    if (wordVocal === "background") return "text-sky-400/20";
    return "text-fuchsia-500/20";
  } else if (!timed) return "text-white";
  else {
    if (longTimed) return "text-[#ffbf00]";
    if (vocal === "lead") return "text-green-400";
    if (vocal === "background") return "text-sky-400";
    return "text-fuchsia-500";
  }
}

export const LyricSyncer = ({
  fullLyrics,
  setVocal,
  vocal,
  player,
  parent,
  setDone,
}: {
  fullLyrics: Lyrics;
  setVocal: any;
  vocal: VoiceType;
  player: any;
  parent: React.RefObject<HTMLDivElement>;
  setDone: any;
}) => {
  const [lyrics, setLyrics] = useState<Lyrics | null>(null);
  const lyricsRef = useRef<Lyrics | null>(null);
  const linesContainer = useRef<HTMLDivElement>(null);
  const [longSync, setLongSync] = useState<number[] | null>(null);
  const playerState = useRef<null | {
    paused: boolean;
    position: number;
    timestamp: number;
    duration: number;
  }>(null);
  const playerStateStarted = useRef(false);

  //   console.log(lyrics);

  const currentLine = useRef(0);
  const lastSynced = useRef(-1);
  const lastSeeked = useRef(-1);
  const spaceDown = useRef<number | null>(null);

  const smoothScrollToCurrentLine = useCallback(() => {
    if (!parent.current) return;
    if (!linesContainer.current) return;
    if (currentLine.current === -1) return;

    let index = lyricsRef.current!.lines[currentLine.current].index;

    smoothScrollBy(
      parent.current!,
      (linesContainer.current?.children[index] as HTMLElement).offsetTop -
        parent.current!.offsetHeight / 2 +
        40 -
        parent.current!.scrollTop +
        (linesContainer.current?.children[index] as HTMLElement).offsetHeight /
          2
    );
  }, [parent]);

  const cutPast = useCallback(
    (cutPoint: number) => {
      let earliestTime = -1;
      let earliestLine = -1;
      for (let i = 0; i < lyrics!.lines.length; i++) {
        const line = lyrics!.lines[i];
        for (let k = 0; k < line.line.length; k++) {
          const word = line.line[k];
          for (let j = 0; j < word.parts.length; j++) {
            const part = word.parts[j];
            if (part.time !== null && part.time > cutPoint) {
              part.time = null;
              part.endTime = undefined;
              setDone(false);
            } else if (part.time !== null) {
              earliestTime = part.time;
              if (
                j === word.parts.length - 1 &&
                k === line.line.length - 1 &&
                i === lyrics!.lines.length - 1
              ) {
                earliestLine = -2;
              } else {
                earliestLine =
                  j === word.parts.length - 1 && k === line.line.length - 1
                    ? i + 1
                    : i;
              }
            }
          }
        }
      }
      if (earliestLine === -2) {
        currentLine.current = -1;
      } else {
        currentLine.current = Math.max(0, earliestLine);
        smoothScrollToCurrentLine();
        console.log("LINE", currentLine.current);
      }

      lastSynced.current = earliestTime;
      setLyrics({ ...lyrics! });
    },
    [lyrics, smoothScrollToCurrentLine, parent]
  );

  const getStatePosition = useCallback(() => {
    const currState = playerState.current;
    if (!currState) return 0;
    if (currState.paused) {
      return currState.position;
    }
    let position =
      currState.position + (performance.now() - currState.timestamp);
    return Math.floor(
      position > currState.duration ? currState.duration : position
    );
  }, []);

  // Playback loop
  useEffect(() => {
    let listenerCallback = (state: any) => {
      if (!state) {
        playerState.current = null;
        return;
      }
      console.log("UPDATE");
      console.log(state);
      playerState.current = {
        paused: state.paused,
        position: state.position,
        timestamp: performance.now(),
        duration: state.duration,
      };
    };
    const inter = setInterval(() => {
      if (!player.current) return;
      if (!lyrics) return;
      if (!playerStateStarted.current) {
        playerStateStarted.current = true;
        player.current.addListener("player_state_changed", listenerCallback);
      } else {
        if (!playerState.current) return;
        if (playerState.current.paused) return;
        let pos = getStatePosition();
        if (lastSynced.current !== -1 && pos + 2500 < lastSynced.current) {
          let cutPoint = pos < 500 ? 0 : pos + 2500;
          cutPast(cutPoint);
        }
      }
      // player.current.getCurrentState().then((state: any) => {
      //   console.log("STATE");

      // });
    }, 50);

    return () => {
      clearInterval(inter);
      if (player.current) {
        player.current.removeListener("player_state_changed", listenerCallback);
        playerStateStarted.current = false;
      }
    };
  }, [cutPast, player, lyrics]);

  // Vocal switch manager
  useEffect(() => {
    let l: Lyrics = {
      lines: [],
      types: [vocal],
    };

    currentLine.current = 0;
    lastSynced.current = -1;

    for (const line of fullLyrics.lines) {
      let words = [];
      for (const word of line.line) {
        if (word.type === vocal) {
          // actual miracle automatic saving between vocal types without intention because it's the same Word and Part objects being used!
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

    for (let i = 0; i < l.lines.length; i++) {
      const line = l.lines[i];
      for (let k = 0; k < line.line.length; k++) {
        const word = line.line[k];
        if (word.type === vocal) {
          for (let j = 0; j < word.parts.length; j++) {
            let part = word.parts[j];
            if (part.time !== null) {
              if (
                j === word.parts.length - 1 &&
                k === line.line.length - 1 &&
                i === l.lines.length - 1
              ) {
                currentLine.current = -1;
                player.current.pause();
              } else {
                currentLine.current =
                  j === word.parts.length - 1 && k === line.line.length - 1
                    ? i + 1
                    : i;
              }

              lastSynced.current = part.time;
            }
          }
        }
      }
    }

    lyricsRef.current = l;
    lastSeeked.current = -1;

    setTimeout(() => {
      if (currentLine.current !== -1) {
        let index = l.lines[currentLine.current].index;
        if (linesContainer.current) {
          let amount;
          if (index === 0) {
            amount = 0;
          } else {
            amount =
              (linesContainer.current?.children[index] as HTMLElement)
                .offsetTop +
              40 -
              parent.current!.offsetHeight / 2;
          }
          if (Math.abs(parent.current!.scrollTop - amount) > 500) {
            parent.current!.scrollTop = amount;
          }
        }
      }
    }, 50);

    setLyrics(l);
  }, [vocal]);

  const switchVocalsIfPossible = useCallback(() => {
    if (!lyricsRef.current) return false;
    const lyrics = lyricsRef.current;

    let nextIndex = lyrics.lines[currentLine.current].index;
    do {
      nextIndex++;
      if (nextIndex >= fullLyrics.lines.length) {
        return false;
      }
    } while (fullLyrics.lines[nextIndex].line[0].parts.length === 0);

    if (nextIndex < fullLyrics.lines.length) {
      let next = fullLyrics.lines[nextIndex].line;
      if (next[0].parts.length !== 0) {
        let type = next[0].type;
        if (type !== vocal && type !== "background") {
          let success = true;
          for (let w of next) {
            if (w.type !== type) {
              success = false;
              return false;
            }
          }
          if (success) {
            for (
              let lineIndex = 0;
              lineIndex < fullLyrics.lines.length;
              lineIndex++
            ) {
              let lline = fullLyrics.lines[lineIndex];
              for (let wword of lline.line) {
                if (wword.type === type) {
                  for (let ppart of wword.parts) {
                    if (ppart.time === null) {
                      if (lineIndex === nextIndex) {
                        setVocal(type);
                        return true;
                      } else {
                        return false;
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    return false;
  }, [vocal, setVocal, fullLyrics, lyricsRef]);

  const longSyncPart = useCallback(
    (line: number, word: number, part: number) => {
      if (!player.current) return;
      if (!lyricsRef.current) return;

      player.current.getCurrentState().then((state: any) => {
        console.log("STATE");
        if (!state) return;
        fullLyrics.lines[line].line[word].parts[part].endTime = state.position;
        lastSynced.current = state.position;
        setLyrics({ ...lyricsRef.current! });
      });
    },
    []
  );

  // Spacebar handler
  useEffect(() => {
    const handleSpacebar = (e: KeyboardEvent) => {
      if (e.key === " ") {
        e.preventDefault();
        if (!lyricsRef.current) return;
        if (!player.current) return;

        const lyrics = lyricsRef.current;

        if (currentLine.current === -1) return;

        let toCancelIfSwitch = null;
        if (spaceDown.current !== null) {
          return;
        } else {
          spaceDown.current = Date.now();
          let r = spaceDown.current;
          toCancelIfSwitch = setTimeout(() => {
            if (spaceDown.current !== r) return;
            let word;
            let part;
            let l = currentLine.current;
            if (l === -1) {
              l = lyrics.lines.length - 1;
            }
            while (
              lyrics.lines[l].line[0].parts.length === 0 ||
              lyrics.lines[l].line[0].parts[0].time === null
            ) {
              l--;
            }
            // console.log(lyrics.lines[l]);
            main: for (const w of lyrics.lines[l].line) {
              for (let i = 0; i < w.parts.length; i++) {
                let p = w.parts[i];
                if (!p.time) break main;
                word = w;
                part = i;
              }
            }
            setLongSync([
              spaceDown.current,
              lyrics.lines[l].index,
              word!.index,
              part!,
            ]);
            spaceDown.current = -1;
          }, 200);
        }

        player.current.getCurrentState().then((state: any) => {
          console.log("STATE");
          if (!state) return;
          //   console.log(currentLine.current);
          for (
            let i = 0;
            i < lyrics.lines[currentLine.current].line.length;
            i++
          ) {
            let word = lyrics.lines[currentLine.current].line[i];
            while (word.parts.length === 0) {
              if (switchVocalsIfPossible()) {
                if (toCancelIfSwitch) clearTimeout(toCancelIfSwitch);
                return;
              }
              currentLine.current++;
              if (currentLine.current >= lyrics.lines.length) {
                currentLine.current = -1;
                player.current.pause();
                return;
                // alert("FINISH!");
              }
              word = lyrics.lines[currentLine.current].line[i];
            }
            for (let j = 0; j < word.parts.length; j++) {
              const part = word.parts[j];
              if (part.time === null) {
                part.time = Math.max(1, state.position);
                if (
                  currentLine.current === lyrics.lines.length - 1 &&
                  i === lyrics.lines[currentLine.current].line.length - 1 &&
                  j === word.parts.length - 1
                ) {
                  let done = true;
                  mmain: for (const ll of fullLyrics.lines) {
                    for (const ww of ll.line) {
                      for (const pp of ww.parts) {
                        if (pp.time === null) {
                          done = false;
                          break mmain;
                        }
                      }
                    }
                  }
                  if (done) setDone(true);
                }
                lastSynced.current = state.position;
                if (
                  i === lyrics.lines[currentLine.current].line.length - 1 &&
                  j === word.parts.length - 1
                ) {
                  if (switchVocalsIfPossible()) {
                    if (toCancelIfSwitch) clearTimeout(toCancelIfSwitch);
                    return;
                  }
                  currentLine.current++;
                  if (currentLine.current >= lyrics.lines.length) {
                    currentLine.current = -1;
                    let startTime = Date.now();
                    setTimeout(
                      () => {
                        if (spaceDown.current === -1) {
                          const inter = setInterval(() => {
                            if (
                              spaceDown.current !== -1 ||
                              Math.abs(
                                state.duration -
                                  state.position +
                                  (Date.now() - startTime)
                              ) < 510
                            ) {
                              player.current.pause();
                              clearInterval(inter);
                            }
                          }, 250);
                        } else {
                          player.current.pause();
                        }
                      },
                      state.duration - state.position < 1500 ? 0 : 350
                    );

                    // alert("FINISH!");
                  }
                }
                if (vocal === "background") {
                  // TODO: Seek player to the next syncable part
                  // TODO: Also show all lyrics not just the same part in all parts!
                }
                smoothScrollToCurrentLine();
                setLyrics({ ...lyrics });
                return;
              }
            }
          }
        });
      } else if (e.key === "ArrowLeft") {
        if (!player.current) return;
        if (Date.now() - lastSeeked.current < 50) return;
        player.current.getCurrentState().then((state: any) => {
          console.log("STATE");
          if (!state) return;
          player.current.seek(Math.max(0, state.position - 5000));
          lastSeeked.current = Date.now();
        });
      }
    };

    window.addEventListener("keydown", handleSpacebar);

    return () => {
      window.removeEventListener("keydown", handleSpacebar);
    };
  }, [
    vocal,
    setVocal,
    setLyrics,
    player,
    fullLyrics,
    parent,
    switchVocalsIfPossible,
    smoothScrollToCurrentLine,
  ]);

  // Long sync reset
  useEffect(() => {
    const handleUp = (e: KeyboardEvent) => {
      if (e.key === " ") {
        spaceDown.current = null;
        if (longSync) {
          setTimeout(() => {
            setLongSync(null);
          }, 10);
        }
      }
    };

    window.addEventListener("keyup", handleUp);

    return () => {
      window.removeEventListener("keyup", handleUp);
    };
  }, [longSync]);

  return (
    <div
      className="h-full w-full max-h-full p-4 flex flex-col gap-3 items-center relative"
      ref={linesContainer}
    >
      {lyrics
        ? fullLyrics.lines.map((line, lineIndex) => (
            <div
              key={lineIndex}
              className="flex flex-wrap justify-center text-4xl font-bold"
            >
              {line.line.map((word, wordIndex) => (
                <div key={wordIndex} className="flex m-0.5">
                  {word.parts.map((part, partIndex) => (
                    <div
                      key={partIndex}
                      className={`mx-[3px] duration-75 relative ${getTextColor(
                        vocal,
                        word.type,
                        part.time !== null,
                        part.endTime !== undefined
                      )}`}
                    >
                      {part.text}
                      {longSync &&
                        longSync[1] === line.index &&
                        longSync[2] === word.index &&
                        longSync[3] === partIndex && (
                          <LongSyncer
                            longSync={longSync[0]}
                            done={() => {
                              longSyncPart(line.index, word.index, partIndex);
                            }}
                          />
                        )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))
        : null}
    </div>
  );
};

const LongSyncer = ({ longSync, done }: { longSync: number; done: any }) => {
  const [time, setTime] = useState(Date.now() - longSync);

  useEffect(() => {
    const inter = setInterval(() => {
      setTime((t) => t + 25);
    }, 25);

    return () => {
      clearInterval(inter);
      done();
    };
  }, []);
  return (
    <motion.div
      animate={{ opacity: 1 }}
      initial={{ opacity: 0 }}
      className="absolute top-0 left-1/2 bg-[#ffbf00] -translate-y-full -translate-x-1/2 rounded-full text-lg text-black px-3 py-1"
    >
      {(time / 1000).toFixed(2)}s
      <div
        className="absolute bottom-0.5 left-1/2 translate-y-full -translate-x-1/2"
        style={{
          borderColor: "#ffbf00",
          borderStyle: "solid",
          borderWidth: "8px",
          borderBottomColor: "transparent",
          borderLeftColor: "transparent",
          borderRightColor: "transparent",
        }}
      />
    </motion.div>
  );
};
