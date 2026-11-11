"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";

type Mode = "sign-in" | "sign-up";

const MIN_PASSWORD = 8;

// Email + password form shared by /sign-in and /sign-up.
export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const isSignUp = mode === "sign-up";

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const name = String(form.get("name") ?? "").trim();

    if (isSignUp && password.length < MIN_PASSWORD) {
      setError(`Use at least ${MIN_PASSWORD} characters for your password.`);
      return;
    }

    setPending(true);
    try {
      const { error: authError } = isSignUp
        ? await authClient.signUp.email({ name, email, password })
        : await authClient.signIn.email({ email, password });

      if (authError) {
        // Generic messages: never reveal whether an email is registered.
        setError(
          authError.status === 429
            ? "Too many attempts. Please wait a moment and try again."
            : isSignUp
              ? "We couldn't create your account. If you already have one, try signing in."
              : "Incorrect email or password.",
        );
        return;
      }
      router.push("/account");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      {isSignUp ? (
        <label className="flex flex-col">
          <span className="label">Name</span>
          <input
            name="name"
            type="text"
            required
            autoComplete="name"
            className="field"
          />
        </label>
      ) : null}
      <label className="flex flex-col">
        <span className="label">Email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="field"
        />
      </label>
      <label className="flex flex-col">
        <span className="label">Password</span>
        <input
          name="password"
          type="password"
          required
          minLength={isSignUp ? MIN_PASSWORD : undefined}
          maxLength={128}
          autoComplete={isSignUp ? "new-password" : "current-password"}
          className="field"
        />
        {isSignUp ? (
          <span className="caption mt-2">At least {MIN_PASSWORD} characters.</span>
        ) : null}
      </label>

      <p className="caption min-h-[1.5em] text-sale" role="alert">
        {error}
      </p>

      <button
        type="submit"
        className="btn btn-primary btn-block"
        disabled={pending}
      >
        {pending ? "Please wait…" : isSignUp ? "Create account" : "Sign in"}
      </button>

      <p className="caption text-center">
        {isSignUp ? (
          <>
            Already have an account?{" "}
            <Link href="/sign-in" className="link-quiet underline underline-offset-4">
              Sign in
            </Link>
          </>
        ) : (
          <>
            New to AVEN?{" "}
            <Link href="/sign-up" className="link-quiet underline underline-offset-4">
              Create an account
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
