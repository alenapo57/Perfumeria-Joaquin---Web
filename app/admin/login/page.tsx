"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";

export default function AdminLoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null);

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <form
        action={formAction}
        className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-oud-800 bg-oud-900 p-6"
      >
        <h1 className="font-display text-xl italic text-parchment">
          Panel — Perfumería Joaquín
        </h1>

        <label className="flex flex-col gap-1 text-sm text-parchment-dim">
          Email
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            className="rounded-md border border-oud-800 bg-oud-950 px-3 py-2 text-parchment"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-parchment-dim">
          Contraseña
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
            className="rounded-md border border-oud-800 bg-oud-950 px-3 py-2 text-parchment"
          />
        </label>

        {state?.error && (
          <p className="rounded-md bg-rose/10 px-3 py-2 text-sm text-rose">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="mt-2 rounded-lg bg-amber px-4 py-2 font-heading font-semibold text-oud-950 transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </main>
  );
}
