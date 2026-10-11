"use client";
import React, { useEffect, useState } from "react";
import Input from "../components/Input";
import { useFormState, useFormStatus } from "react-dom";
import { login } from "@/actions";

const initialState = {
  error: "",
};

const SubmitButton = () => {
  const { pending } = useFormStatus();

  return (
    <button
      disabled={pending}
      className="bg-green-400 text-black py-2 px-4 rounded-3xl w-full mt-5 font-medium text-[1.3rem] enabled:hover:w-[105%] duration-200 disabled:text-black/40"
    >
      Login
    </button>
  );
};

const Login = () => {
  const [state, formAction] = useFormState(login, initialState);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    setShowError(true);
  }, [state]);

  return (
    <form className="flex flex-col items-center" action={formAction}>
      <Input
        placeholder="Email"
        type="email"
        name="email"
        onChange={() => setShowError(false)}
        error={
          showError && state && state.error !== ""
            ? { mode: "always", message: state.error! }
            : null
        }
      />
      <Input
        placeholder="Password"
        type="password"
        name="password"
        onChange={() => setShowError(false)}
        error={
          showError && state && state.error !== ""
            ? { mode: "always", message: "" }
            : null
        }
      />
      <SubmitButton />
    </form>
  );
};

export default Login;
