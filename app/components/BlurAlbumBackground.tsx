"use client";
import Image from "next/image";
import React, { useEffect, useState } from "react";

const BlurAlbumBackground = ({ url }: { url?: string }) => {
  const [update, setUpdate] = useState(false);
  useEffect(() => {
    const callback = () => {
      setUpdate((u) => !u);
    };

    window.addEventListener("resize", callback);

    return () => {
      window.removeEventListener("resize", callback);
    };
  }, []);
  if (!url) return null;

  const size = Math.max(window.innerWidth, window.innerHeight);
  return (
    <div className="fixed top-0 left-0 w-full h-full -z-50 opacity-65">
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center "
        style={{
          width: size,
          height: size,
        }}
      >
        <Image
          src={url}
          alt="Background"
          width={640}
          height={640}
          className={`object-cover rounded-full bluralbumbg blur-3xl`}
          style={{
            // "https://i.scdn.co/image/ab67616d0000b27371d62ea7ea8a5be92d3c1f62"
            width: size,
            height: size,
            // rotate: rotate + "deg",
          }}
        />
      </div>
    </div>
  );
};

export default BlurAlbumBackground;
