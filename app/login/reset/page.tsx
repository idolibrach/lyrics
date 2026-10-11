"use client";
import { forgotPassword } from "@/actions";
import Input from "@/app/components/Input";
import React, { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";

const initialState = {
  state: "idle",
};

const SubmitButton = () => {
  const { pending } = useFormStatus();

  return (
    <button
      className="bg-sky-300 py-2 px-4 rounded-3xl w-full mt-1 font-medium text-[1.3rem] enabled:hover:w-[105%] duration-200 disabled:text-black/40"
      disabled={pending}
    >
      Send
    </button>
  );
};

const ResetPassword = () => {
  const [state, formAction] = useFormState(forgotPassword, initialState);
  return (
    <div className="w-full min-h-[100vh] flex justify-center items-center flex-col text-center">
      <h1 className="font-bold text-3xl">Forgot Password</h1>
      <div>
        Enter your email and we'll send you a link to reset your password
      </div>
      <form className="flex flex-col items-center mt-5" action={formAction}>
        <Input
          name="email"
          type="email"
          placeholder="Email"
          error={
            state.state === "error"
              ? {
                  message: "Couldn't find account",
                  mode: "always",
                }
              : null
          }
        />
        <SubmitButton />
      </form>
      {state.state === "success" && (
        <div className="font-medium text-green-600 mt-1 text-lg">
          Success! Check your inbox (and the spam folder) to reset your
          password.
        </div>
      )}
    </div>
  );
};

export default ResetPassword;
