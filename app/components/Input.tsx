"use client";
import { ChangeEventHandler, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

export type Error = {
  message: string;
  mode: "always" | "unfocused";
};

type Props = {
  value?: string;
  type?: string;
  placeholder?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  error?: Error | null;
  className?: string;
  disabled?: boolean;
  selectAllWhenClicked?: boolean;
  name: string;
};

function Input(props: Props) {
  const [changed, setChanged] = useState(false);
  const { pending } = useFormStatus();
  const input = useRef<HTMLInputElement>(null);
  const isError = props.error && (props.error.mode === "always" || changed);
  return (
    <div className="relative">
      <input
        name={props.name}
        ref={input}
        disabled={props.disabled || pending}
        className={`w-[350px] h-[50px] border-0 bg-white/10 rounded-lg px-5 py-0 font-medium text-lg mb-2 max-w-[95vw] ${
          isError
            ? "text-[#ff0000] border-2 border-solid outline-0 border-[#ff0000]"
            : ""
        }`}
        type={props.type}
        placeholder={props.placeholder}
        value={props.value}
        onBlur={() => setChanged(true)}
        onClick={() => {
          if (!props.selectAllWhenClicked) return;
          input.current?.select();
        }}
        onChange={(e) => {
          setChanged(false);
          if (props.onChange) props.onChange(e);
        }}
      />
      {isError && (
        <div
          className="absolute top-[-11px] left-[17px] text-[0.95rem] max-w-[87%] text-ellipsis overflow-hidden whitespace-nowrap text-[#ff0000] px-[3px]"
          style={{
            background:
              "linear-gradient(0deg, rgba(26,26,26,1) 0%, rgba(26,26,26,1) 52%, rgba(255,255,255,0) 52%, rgba(255,255,255,0) 100%)",
          }}
        >
          {props.error?.message}
        </div>
      )}
    </div>
  );
}

export default Input;
