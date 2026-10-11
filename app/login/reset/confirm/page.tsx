"use client";
import { forgotPasswordConfirm } from "@/actions";
import Input from "@/app/components/Input";
import { useSearchParams } from "next/navigation";
import React, { Suspense } from "react";
import { useFormState, useFormStatus } from "react-dom";

const initialState = {
  state: "",
};

const SubmitButton = () => {
  const { pending } = useFormStatus();

  return (
    <button
      className="bg-sky-300 py-2 px-4 rounded-3xl w-full mt-1 font-medium text-[1.3rem] enabled:hover:w-[105%] duration-200 disabled:text-black/40"
      disabled={pending}
    >
      Confirm
    </button>
  );
};

const Wrapper = () => {
  return (
    <Suspense>
      <ConfirmPasswordReset />
    </Suspense>
  );
};

const ConfirmPasswordReset = () => {
  const [state, formAction] = useFormState(forgotPasswordConfirm, initialState);
  const query = useSearchParams();
  return (
    <div className="w-full min-h-[100vh] flex justify-center items-center flex-col text-center">
      <h1 className="font-bold text-3xl">Reset Password</h1>
      <div>You may now create a new password. Make sure to remember it!</div>
      <form
        className="flex flex-col items-center mt-5"
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.target as HTMLFormElement);
          data.set("userId", query.get("userId") as string);
          data.set("secret", query.get("secret") as string);
          formAction(data);
        }}
      >
        <Input
          name="password"
          type="password"
          placeholder="Password"
          error={
            state.state !== ""
              ? {
                  message: state.state,
                  mode: "always",
                }
              : null
          }
        />
        <Input
          name="cpassword"
          type="password"
          placeholder="Confirm password"
          error={
            state.state !== ""
              ? {
                  message: "",
                  mode: "always",
                }
              : null
          }
        />
        <SubmitButton />
      </form>
    </div>
  );
};

export default Wrapper;
