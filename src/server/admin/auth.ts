import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CognitoProvider from "next-auth/providers/cognito";

/**
 * Staff sign-in: Amazon Cognito (admin user pool, me-central-1) via OIDC.
 * Roles come from Cognito groups: owner > editor > frontdesk. No group → no admin access.
 * Guests never use this; their passwordless flow is separate (Day 4).
 */
export type AdminRole = "owner" | "editor" | "frontdesk";
const RANK: Record<AdminRole, number> = { frontdesk: 1, editor: 2, owner: 3 };

export const adminConfigured = () => !!(process.env.COGNITO_ADMIN_CLIENT_ID && process.env.COGNITO_ADMIN_CLIENT_SECRET && process.env.COGNITO_ADMIN_ISSUER && process.env.NEXTAUTH_SECRET);

export const authOptions: NextAuthOptions = {
  providers: adminConfigured() ? [
    CognitoProvider({
      clientId: process.env.COGNITO_ADMIN_CLIENT_ID!,
      clientSecret: process.env.COGNITO_ADMIN_CLIENT_SECRET!,
      issuer: process.env.COGNITO_ADMIN_ISSUER!,   // https://cognito-idp.me-central-1.amazonaws.com/<poolId>
      profile(profile) {
        return { id: profile.sub, name: profile.name ?? profile.email, email: profile.email, groups: profile["cognito:groups"] ?? [] };
      },
    }),
  ] : [],
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: { signIn: "/admin/sign-in" },
  callbacks: {
    jwt({ token, user }) {
      if (user && "groups" in user) token.role = roleFromGroups((user as { groups?: unknown }).groups);
      return token;
    },
    session({ session, token }) {
      (session as unknown as AdminSession).role = (token.role as AdminRole | null) ?? null;
      return session;
    },
  },
};

export interface AdminSession { user?: { email?: string | null; name?: string | null }; role: AdminRole | null }

export function roleFromGroups(groups: unknown): AdminRole | null {
  const g = Array.isArray(groups) ? groups.map(String) : [];
  if (g.includes("owner")) return "owner";
  if (g.includes("editor")) return "editor";
  if (g.includes("frontdesk")) return "frontdesk";
  return null;
}

export const hasRole = (role: AdminRole | null, min: AdminRole) => !!role && RANK[role] >= RANK[min];

export class ForbiddenError extends Error { constructor(msg = "Forbidden") { super(msg); } }

/** Server-side guard for pages, route handlers and server actions. */
export async function requireAdmin(min: AdminRole = "frontdesk"): Promise<{ email: string; role: AdminRole }> {
  const s = (await getServerSession(authOptions)) as AdminSession | null;
  if (!s?.user?.email || !hasRole(s.role, min)) throw new ForbiddenError();
  return { email: s.user.email, role: s.role! };
}
