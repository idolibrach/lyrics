import React from "react";

const Separator = ({ text }: { text?: string }) => {
  return (
    <div className="relative w-[93%]">
      <div className="border-white/30 border-b-[1px] border-solid w-[110%] ml-[-5%]"></div>
      <div className="absolute -top-[12.7px] left-0 w-full flex justify-center">
        <div className="relative">
          <div className="absolute top-0 left-0 w-full h-full flex items-center">
            <div className="w-full h-[4px] -mb-[2px] backdrop-blur-3xl"></div>
          </div>
          <div className=" px-1 relative">{text}</div>
        </div>
      </div>
    </div>
  );
};

export const SeparatorLegacy = ({ text }: { text?: string }) => {
  return (
    <div className="relative">
      <div className="border-white/30 border-b-[1px] border-solid w-[110%] ml-[-5%] my-8"></div>
      <div className="absolute top-[-12.7px] left-0 w-full flex justify-center">
        <div className="backdrop-blur-3xl px-1">{text}</div>
      </div>
    </div>
  );
};

export default Separator;
