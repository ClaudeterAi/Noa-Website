"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

/** next-auth needs a POST with its CSRF token to start OAuth; a plain link does not work. */
export default function SignInButton() {
  const [busy, setBusy] = useState(false);
  return (
    <button type="button" disabled={busy} onClick={() => { setBusy(true); void signIn("cognito", { callbackUrl: "/admin" }); }}>
      {busy ? "Redirecting…" : "Continue with NOA staff account"}
    </button>
  );
}
