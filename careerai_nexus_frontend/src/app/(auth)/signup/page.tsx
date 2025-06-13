"use client";
import { signIn, getProviders } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import React, { useEffect, useState, FormEvent } from "react";

// PUBLIC_INTERFACE
export default function SignUpPage() {
  /** Renders the sign-up UI, handles credentials/Google flows, error+redirect logic */

  const [providers, setProviders] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const error = searchParams.get("error");

  useEffect(() => {
    getProviders().then(setProviders);
  }, []);

  useEffect(() => {
    // Surface errors from URL (e.g. credentials error)
    if (error === "CredentialsSignin") {
      setFormError("Invalid email or password.");
    } else if (error === "OAuthAccountNotLinked") {
      setFormError(
        "Account already registered with different sign-in method."
      );
    } else if (error) {
      setFormError("Sign up failed. Please try again.");
    }
  }, [error]);

  // PUBLIC_INTERFACE
  async function handleCredentialsSignUp(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setFormError(null);

    // Try credentials sign-in after registration to auto-login.
    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
      callbackUrl,
      register: "true", // Used to trigger sign-up logic server-side
    });
    setPending(false);
    if (res?.error) {
      setFormError(
        res.error === "CredentialsSignin"
          ? "Sign up failed. Try a different email."
          : res.error
      );
    } else if (res?.ok) {
      router.push(res.url || "/");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-white dark:bg-black transition-colors duration-300">
      <div
        className="w-full max-w-md p-8 rounded-2xl shadow-lg bg-white/80
        dark:bg-[#0a0a0a]/90 border border-pink-200 dark:border-cyan-600
        flex flex-col gap-6"
      >
        <h1 className="text-3xl font-bold text-center text-black dark:text-cyan-300">
          Sign Up
        </h1>

        {formError && (
          <div className="bg-pink-100 dark:bg-cyan-900 text-pink-700 dark:text-cyan-400 rounded px-4 py-2 text-center text-sm font-medium border border-pink-200 dark:border-cyan-700">
            {formError}
          </div>
        )}

        {providers?.google && (
          <button
            onClick={() => signIn("google", { callbackUrl })}
            className="flex items-center justify-center w-full py-3 rounded-md font-semibold
              bg-pink-400 dark:bg-cyan-600 hover:bg-pink-500 dark:hover:bg-cyan-400
              text-white dark:text-black transition-colors text-base shadow"
            type="button"
            aria-label="Sign up with Google"
            disabled={pending}
          >
            <svg
              aria-hidden="true"
              focusable="false"
              className="h-5 w-5 mr-2"
              viewBox="0 0 24 24"
            >
              <path
                fill="#4285F4"
                d="M21.805 10.023h-9.765v3.975h6.039c-.19 1.099-1.23 3.224-6.039 3.224-3.642 0-6.617-3.03-6.617-6.718 0-3.687 2.975-6.717 6.617-6.717 2.072 0 3.464.793 4.265 1.509l2.899-2.82C19.057 1.798 16.625.75 13.885.75 7.375.75 1.999 6.128 1.999 12.75s5.375 12 12.001 12c8.179 0 12-7.093 12-11.759 0-.797-.073-1.419-.195-1.968z"
              ></path>
            </svg>
            Sign up with Google
          </button>
        )}

        {providers?.credentials && (
          <form
            className="flex flex-col gap-4 mt-2"
            onSubmit={handleCredentialsSignUp}
            noValidate
            autoComplete="off"
          >
            <label className="font-semibold text-black dark:text-cyan-300">
              Email
              <input
                name="email"
                type="email"
                className="mt-1 w-full px-3 py-2 rounded border border-pink-200 dark:border-cyan-700 focus:border-pink-500 dark:focus:border-cyan-400 focus:outline-none text-black dark:text-cyan-200 bg-white dark:bg-black/80 transition"
                required
                autoComplete="email"
                value={email}
                disabled={pending}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="font-semibold text-black dark:text-cyan-300">
              Password
              <input
                name="password"
                type="password"
                className="mt-1 w-full px-3 py-2 rounded border border-pink-200 dark:border-cyan-700 focus:border-pink-500 dark:focus:border-cyan-400 focus:outline-none text-black dark:text-cyan-200 bg-white dark:bg-black/80 transition"
                required
                autoComplete="new-password"
                value={password}
                disabled={pending}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <button
              type="submit"
              className="mt-2 py-2 rounded bg-black dark:bg-cyan-400 text-white dark:text-black font-semibold hover:bg-pink-600 dark:hover:bg-cyan-200 transition-colors disabled:opacity-50"
              disabled={pending}
            >
              {pending ? "Signing up..." : "Sign up"}
            </button>
          </form>
        )}

        <div className="text-center text-sm pt-2">
          Already have an account?
          <a
            href={`/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            className="ml-1 font-bold underline text-pink-600 dark:text-cyan-400 hover:text-pink-400 dark:hover:text-cyan-200"
          >
            Sign in
          </a>
        </div>
      </div>
    </main>
  );
}
