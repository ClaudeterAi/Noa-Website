import Link from "next/link";
import { adminConfigured } from "@/server/admin/auth";

export default function SignIn() {
  return (
    <main className="ad-signin">
      <div className="card" style={{ width: 360, textAlign: "center" }}>
        <div style={{ letterSpacing: ".45em", marginBottom: 18 }}>NOA</div>
        <h1 style={{ fontSize: "1.4rem" }}>Staff sign-in</h1>
        {adminConfigured() ? (
          <Link href="/api/auth/signin/cognito?callbackUrl=/admin"><button type="button">Continue with NOA staff account</button></Link>
        ) : (
          <p className="note">Admin sign-in is not configured on this deployment yet (Cognito admin pool env vars missing).</p>
        )}
      </div>
    </main>
  );
}
