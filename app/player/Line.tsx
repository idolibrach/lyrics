import React, { useEffect, useMemo, useState } from "react";
import { Line, Lyrics } from "../editor/page";

const LineDisplay = ({ line, lyrics, distance, player, time }: { line: Line; lyrics: Lyrics; distance: number; player: any; time: number }) => {
  // const [time, setTime] = useState(-1);
  const inLine = time >= line.start! && time <= line.end!;

  const [calculatedHeight, setCalculatedHeight] = useState(-1);
  const afterRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (afterRef.current) {
      setCalculatedHeight(afterRef.current.scrollHeight);
    }
  }, [afterRef.current]);

  // useEffect(() => {
  //   if (distance === 0) {
  //     const inter = setInterval(() => {
  //       if (!player.current) return;
  //       player.current.getCurrentState().then((state: any) => {
  //         if (!state) return;
  //         setTime(state.position);
  //       });
  //     }, 15);
  //     return () => {
  //       clearInterval(inter);
  //       setTime((t) => t + 15);
  //     };
  //   }
  // }, [distance]);

  // console.log("LINE: " + line.index + ", TIME: " + time);

  return (
    <div
      className={`flex flex-col items-start duration-300 my-3 ${
        inLine
          ? "blur-0"
          : distance === 3
          ? "blur-[2px] "
          : distance === 2
          ? "blur-[1.5px] "
          : distance === 1
          ? "blur-[1px] "
          : distance === 0
          ? "blur-0"
          : "blur-[2px] "
      } ${line.index === 0 ? "mt-0" : line.index === lyrics.lines.length - 1 ? "mb-0" : ""}`}
    >
      {line.before.length > 0 && (
        <div
          className={`flex flex-wrap justify-start text-2xl font-medium pr-0.5 duration-300 origin-bottom-left will-change-transform ${
            distance === 0 ? "scale-105" : ""
          }`}
        >
          {line.before.map((word, wordIndex) => (
            <div
              style={{
                transitionDuration: `${!inLine ? 400 : Math.max(word.parts[word.parts.length - 1].endTime! - word.parts[0].time!, 400)}ms`,
              }}
              key={wordIndex}
              className={`flex mx-1 ease-out will-change-transform ${(inLine || distance === 0) && time >= word.parts[0].time! ? " -translate-y-[1px]" : ""}`}
            >
              {word.parts.map((part, partIndex) => (
                <span // STYLED IN CSS
                  data-text={part.text}
                  key={partIndex}
                  style={
                    {
                      "--transition-duration": inLine ? `${part.endTime! - part.time!}ms` : "1000ms",
                    } as any
                  }
                  className={`text-white/35 relative drop-shadow karaoke-text ${
                    time >= part.time!
                      ? time >= line.end! && distance !== 0
                        ? time >= line.end! + 5000 && distance > 1
                          ? "highlighted done very"
                          : "highlighted done"
                        : "highlighted"
                      : ""
                  }`}
                >
                  {part.text}
                </span>
              ))}
            </div>
          ))}
        </div>
      )}
      {line.line.length > 0 && (
        <div
          className={`flex flex-wrap justify-start text-4xl font-bold duration-300 origin-bottom-left will-change-transform ${
            line.duet.length > 0 ? "max-w-[75%]" : ""
          }  ${distance === 0 ? "scale-105" : ""}`}
        >
          {line.line.map((word, wordIndex) => (
            <div
              key={wordIndex}
              style={{
                transitionDuration: `${!inLine ? 400 : Math.max(word.parts[word.parts.length - 1].endTime! - word.parts[0].time!, 400)}ms`,
              }}
              className={`flex mx-[5px] ease-out will-change-transform ${
                (inLine || distance === 0) && time >= word.parts[0].time! ? " -translate-y-[2px]" : ""
              }`}
            >
              {word.parts.map((part, partIndex) => (
                <span // STYLED IN CSS
                  data-text={part.text}
                  key={partIndex}
                  style={
                    {
                      "--transition-duration": inLine ? `${part.endTime! - part.time!}ms` : "1000ms",
                    } as any
                  }
                  className={`text-white/35 relative drop-shadow karaoke-text ${
                    time >= part.time!
                      ? time >= line.end! && distance !== 0
                        ? time >= line.end! + 5000 && distance > 1
                          ? "highlighted done very"
                          : "highlighted done"
                        : "highlighted"
                      : ""
                  }`}
                >
                  {part.text}
                </span>
              ))}
            </div>
          ))}
        </div>
      )}

      {line.after.length > 0 && (
        <div
          ref={afterRef}
          style={{
            height: (
              line.after.length > 0
                ? line.after[0].parts.length > 0 && Math.max(line.after[0].parts[0].time! - 750, line.start!) - line.start! > 750
                  ? time >= Math.max(line.after[0].parts[0].time! - 750, line.start!)
                  : time >= line.start!
                : time >= line.start!
            )
              ? calculatedHeight
              : 0,
            filter: (
              line.after.length > 0
                ? line.after[0].parts.length > 0 && Math.max(line.after[0].parts[0].time! - 750, line.start!) - line.start! > 750
                  ? time >= Math.max(line.after[0].parts[0].time! - 750, line.start!)
                  : time >= line.start!
                : time >= line.start!
            )
              ? "blur(0px)"
              : "blur(6px)",
          }}
          className={`flex flex-wrap overflow-hidden justify-start text-2xl font-medium transition-[transform,height,filter] duration-[300ms,600ms,750ms] blur-lg origin-bottom-left will-change-transform ${
            distance === 0 ? "scale-105" : ""
          }`}
        >
          {line.after.map((word, wordIndex) => (
            <div
              style={{
                transitionDuration: `${!inLine ? 400 : Math.max(word.parts[word.parts.length - 1].endTime! - word.parts[0].time!, 400)}ms`,
              }}
              key={wordIndex}
              className={`flex mx-1 ease-out will-change-transform ${(inLine || distance === 0) && time >= word.parts[0].time! ? " -translate-y-[1px]" : ""}`}
            >
              {word.parts.map((part, partIndex) => (
                <span // STYLED IN CSS
                  data-text={part.text}
                  key={partIndex}
                  style={
                    {
                      "--transition-duration": inLine ? `${part.endTime! - part.time!}ms` : "1000ms",
                    } as any
                  }
                  className={`text-white/35 relative drop-shadow karaoke-text ${
                    time >= part.time!
                      ? time >= line.end! && distance !== 0
                        ? time >= line.end! + 5000 && distance > 1
                          ? "highlighted done very"
                          : "highlighted done"
                        : "highlighted"
                      : ""
                  }`}
                >
                  {part.text}
                </span>
              ))}
            </div>
          ))}
        </div>
      )}
      {line.duet.length > 0 && (
        <div
          className={`flex w-full justify-end duration-300 origin-bottom-right will-change-transform ${line.duetbefore ? "-order-1" : ""}  ${
            distance === 0 ? "scale-105" : ""
          }`}
        >
          <div className={`flex flex-wrap justify-end text-4xl font-bold w-[75%] ${line.line.length > 0 ? (line.duetbefore ? "mb-2" : "mt-2") : ""}`}>
            {line.duet.map((word, wordIndex) => (
              <div
                style={{
                  transitionDuration: `${!inLine ? 400 : Math.max(word.parts[word.parts.length - 1].endTime! - word.parts[0].time!, 400)}ms`,
                }}
                key={wordIndex}
                className={`flex mx-[5px] ease-out will-change-transform ${
                  (inLine || distance === 0) && time >= word.parts[0].time! ? " -translate-y-[2px]" : ""
                }`}
              >
                {word.parts.map((part, partIndex) => (
                  <span // STYLED IN CSS
                    data-text={part.text}
                    key={partIndex}
                    style={
                      {
                        "--transition-duration": inLine ? `${part.endTime! - part.time!}ms` : "1000ms",
                      } as any
                    }
                    className={`text-white/35 relative drop-shadow karaoke-text ${
                      time >= part.time!
                        ? time >= line.end! && distance !== 0
                          ? time >= line.end! + 5000 && distance > 1
                            ? "highlighted done very"
                            : "highlighted done"
                          : "highlighted"
                        : ""
                    }`}
                  >
                    {part.text}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LineDisplay;
