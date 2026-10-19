import { adminConfigured } from "@/server/admin/auth";
import SignInButton from "./SignInButton";

const ERRORS: Record<string, string> = {
  cognito: "Could not start the sign-in with Cognito. Try again; if it repeats, the Cognito client settings need checking.",
  OAuthCallback: "Cognito did not return a valid sign-in. Try again.",
  OAuthAccountNotLinked: "This email is already linked to another sign-in method.",
  AccessDenied: "Your account has no admin role yet. Ask an owner to add you to a group.",
  Configuration: "Admin sign-in is misconfigured on this deployment.",
  default: "Sign-in failed. Try again.",
};

export default async function SignIn({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="ad-signin">
      <div className="card" style={{ width: 380, textAlign: "center" }}>
        <div style={{ letterSpacing: ".45em", marginBottom: 18 }}>NOA</div>
        <h1 style={{ fontSize: "1.4rem" }}>Staff sign-in</h1>
        {adminConfigured() ? <SignInButton /> : <p className="note">Admin sign-in is not configured on this deployment yet (Cognito admin pool env vars missing).</p>}
        {error && <p className="err" style={{ marginTop: 14 }}>{ERRORS[error] ?? ERRORS.default}</p>}
      </div>
    </main>
  );
}
