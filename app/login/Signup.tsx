"use client";
import React, { useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import Input from "../components/Input";
import { signup } from "@/actions";

const initialState: {
  email: string | null;
  pass: string | null;
  cpass: string | null;
} = {
  email: null,
  pass: null,
  cpass: null,
};

const SubmitButton = () => {
  const { pending } = useFormStatus();

  return (
    <button
      disabled={pending}
      className="bg-green-400 text-black py-2 px-4 rounded-3xl w-full mt-5 font-medium text-[1.3rem] enabled:hover:w-[105%] duration-200 disabled:text-black/40"
    >
      Sign up
    </button>
  );
};

const Signup = () => {
  const [state, formAction] = useFormState(signup, initialState);

  return (
    <form className="flex flex-col items-center" action={formAction}>
      <Input
        placeholder="Email"
        type="email"
        name="email"
        error={state.email ? { mode: "always", message: state.email } : null}
      />
      <Input
        placeholder="Password"
        type="password"
        name="password"
        error={state.pass ? { mode: "always", message: state.pass } : null}
      />
      <Input
        placeholder="Confirm Password"
        type="password"
        name="cpassword"
        error={state.cpass ? { mode: "always", message: state.cpass } : null}
      />
      <SubmitButton />
    </form>
  );
};

export default Signup;
