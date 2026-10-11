import React, { useCallback, useEffect, useRef, useState } from "react";
import { Lyrics } from "../editor/page";
import Line from "./Line";
import { smoothScrollBy } from "../editor/LyricSyncer";

const LyricsDisplay = ({
  lyrics,
  player,
}: {
  lyrics: Lyrics | null;
  player: any;
}) => {
  const [currentLine, setCurrentLine] = useState(0);
  const lineref = useRef(0);
  const [time, setTime] = useState(-1);
  const [paused, setPaused] = useState(false);
  const timeref = useRef(-1);
  const parent = useRef<HTMLDivElement>(null);
  const playerState = useRef<null | {
    paused: boolean;
    position: number;
    timestamp: number;
    duration: number;
  }>(null);

  useEffect(() => {
    player.current.addListener("player_state_changed", (state: any) => {
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
      setPaused(state.paused);
    });

    return () => {
      player.current.removeListener("player_state_changed");
    };
  }, []);

  const smoothScrollToLine = useCallback((line: number) => {
    if (!parent.current) return;
    if (!lyrics) return;
    if (line < 0 || line >= lyrics.lines.length) return;
    console.log("call");

    let index = lyrics.lines[line].index;

    smoothScrollBy(
      parent.current!,
      (parent.current?.children[index] as HTMLElement).offsetTop -
        parent.current!.offsetHeight / 2 +
        40 -
        parent.current!.scrollTop +
        (parent.current?.children[index] as HTMLElement).offsetHeight / 2
    );
  }, []);

  const getStatePosition = useCallback(() => {
    const currState = playerState.current;
    if (!currState) return 0;
    if (currState.paused) {
      return currState.position;
    }
    let position =
      currState.position + (performance.now() - currState.timestamp);
    return position > currState.duration ? currState.duration : position;
  }, []);

  useEffect(() => {
    const inter = setInterval(() => {
      if (!lyrics) return;
      if (!playerState.current) return;
      if (playerState.current.paused) return;
      let nt = getStatePosition() + 200;

      let line = 0;
      for (const l of lyrics.lines) {
        if (l.start! > nt) break;
        line++;
      }
      setTime(nt);
      setCurrentLine(line - 1);
      if (line - 1 !== lineref.current) {
        console.log(
          "scroll " + "line=" + (line - 1) + "current=" + lineref.current
        );
        smoothScrollToLine(line - 1);
        lineref.current = line - 1;
      } else {
        console.log(
          "NO SCROLL " + "line=" + (line - 1) + "current=" + lineref.current
        );
      }
    }, 25);

    return () => clearInterval(inter);
  }, [lyrics]);

  // console.log("RENDER");

  if (!lyrics) return null;

  return (
    <div
      className="h-full max-w-[700px] overflow-y-scroll no-scrollbar select-none pl-6 pr-[45px]"
      ref={parent}
      style={{
        paddingTop: "calc(50vh - 225px)",
        paddingBottom: "calc(50vh - 225px)",
      }}
    >
      {lyrics.lines.map((line, lineIndex) => (
        <Line
          time={time}
          player={player}
          line={line}
          key={lineIndex}
          lyrics={lyrics}
          distance={Math.abs(currentLine - lineIndex)}
        />
      ))}
    </div>
  );
};

export default LyricsDisplay;
