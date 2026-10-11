import React, { useCallback, useEffect, useRef, useState } from "react";
import { VoiceType } from "./page";

function isMouseInsideElement(
  element: HTMLElement,
  mouseX: number,
  mouseY: number
) {
  const rect = element.getBoundingClientRect();
  return (
    mouseX >= rect.left &&
    mouseX <= rect.right &&
    mouseY >= rect.top &&
    mouseY <= rect.bottom
  );
}

const Timeline = ({ player, vocal }: { player: any; vocal: VoiceType }) => {
  const [temp, setTemp] = useState(-1);
  const timeline = useRef<HTMLDivElement>(null);
  const playerState = useRef<null | {
    paused: boolean;
    position: number;
    timestamp: number;
    duration: number;
  }>(null);
  const playerStateStarted = useRef(false);

  const [current, setCurrent] = useState(-1);
  const [total, setTotal] = useState(-1);
  const [paused, setPaused] = useState(false);

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
      setPaused(state.paused);
      setTotal(state.duration);
    };
    const inter = setInterval(() => {
      if (!player.current) return;
      if (!playerStateStarted.current) {
        playerStateStarted.current = true;
        player.current.addListener("player_state_changed", listenerCallback);
      } else {
        if (!playerState.current) return;
        let pos = getStatePosition();
        setCurrent(pos);
      }

      // player.current.getCurrentState().then((state: any) => {
      //   if (!state) return;
      //   setCurrent(state.position);
      //   setTotal(state.duration);
      //   setPaused(state.paused);
      //   // console.log(state);
      // });
    }, 50);

    return () => {
      clearInterval(inter);
      if (player.current) {
        console.log("turn off");
        playerStateStarted.current = false;
        player.current.removeListener("player_state_changed", listenerCallback);
      }
    };
  }, []);

  if (total === -1 || current === -1) {
    return null;
  }

  return (
    <div
      ref={timeline}
      className="w-2/3 border-white/80 border-[2px] border-solid rounded-xl h-14 bg-white/20 relative cursor-default"
      onMouseLeave={() => setTemp(-1)}
      onClick={() => {
        if (temp === -1) return;
        player.current.seek(Math.floor(temp));
        setTemp(-1);
      }}
      onMouseMove={(e) => {
        let el = timeline.current!;
        if (
          !isMouseInsideElement(
            timeline.current as HTMLElement,
            e.clientX,
            e.clientY
          )
        )
          return;
        let w = el.offsetWidth;
        let x = e.clientX - el.getBoundingClientRect().left;
        let milis = (x / w) * total;
        if (milis < 0) return;
        setTemp(milis);
      }}
    >
      {Array.from({ length: total / 10000 }).map((_, i) => {
        let milis = (i + 1) * 10000;
        return (
          <div
            key={i}
            className={`absolute -top-0 w-[2px] bg-white ${
              Math.abs(milis - total) <= 2000 ? "hidden" : ""
            }`}
            style={{
              left: `${(milis / total) * 100}%`,
              height: milis % 60000 === 0 ? "0.75rem" : "0.5rem",
            }}
          >
            {milis % 60000 === 0 && (
              <div className="absolute -top-6 left-[-1.75ch]">
                {(i + 1) / 6}:00
              </div>
            )}
          </div>
        );
      })}
      {temp !== -1 && (
        <div
          className="w-[2px] h-[100%] absolute top-0 bg-white/40"
          style={{
            left: `calc(${(temp / total) * 100}% - 1px)`,
          }}
        ></div>
      )}

      <div
        className="w-[4px] h-[140%] absolute top-[-20%] bg-white rounded-xl shadow-white shadow duration-[50ms]"
        style={{
          left: `calc(${(current / total) * 100}% - 2px)`,
        }}
      ></div>
      <div className="absolute h-full -right-[10.5rem] w-40 flex items-center text-xl font-medium">
        {Math.floor(total / 60000)}:
        {total % 60000 < 10000
          ? `0${Math.floor(total / 1000) % 60}`
          : Math.floor(total / 1000) % 60}
      </div>
      <div className="absolute h-full -left-[10.5rem] w-40 flex items-center text-xl justify-end font-medium">
        <div>
          <img
            src={paused ? "/play.svg" : "pause.svg"}
            width={64}
            height={64}
            alt="Play/pause"
            onClick={() => {
              if (!player.current) return;
              if (paused) {
                player.current.resume();
              } else {
                player.current.pause();
              }
            }}
            className={`mr-1 cursor-pointer ${
              vocal === "lead"
                ? "filterlead"
                : vocal === "background"
                ? "filterbackground"
                : "filterduet"
            }`}
          />
        </div>
        <div>
          {Math.floor((temp === -1 ? current : temp) / 60000)}:
          {(temp === -1 ? current : temp) % 60000 < 10000
            ? `0${Math.floor((temp === -1 ? current : temp) / 1000) % 60}`
            : Math.floor((temp === -1 ? current : temp) / 1000) % 60}
        </div>
      </div>
    </div>
  );
};

export default Timeline;
