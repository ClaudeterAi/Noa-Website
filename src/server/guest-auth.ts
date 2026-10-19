import { CognitoIdentityProviderClient, InitiateAuthCommand, RespondToAuthChallengeCommand, AdminCreateUserCommand, AdminGetUserCommand, type UserNotFoundException } from "@aws-sdk/client-cognito-identity-provider";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { guests } from "@/db/schema";

/**
 * Passwordless guest sign-in on Cognito's native EMAIL_OTP (USER_AUTH flow): the guest types their email,
 * Cognito emails a one-time code, we verify it and issue the signed `noa_guest` cookie that the booking
 * engine already honours (VIP priority, "welcome back"). No passwords, no Lambda triggers.
 */
const region = () => process.env.COGNITO_REGION ?? process.env.BEDROCK_REGION ?? "eu-central-1";
const poolId = () => process.env.COGNITO_GUEST_POOL_ID;
const clientId = () => process.env.COGNITO_GUEST_CLIENT_ID;
export const guestAuthConfigured = () => !!(poolId() && clientId() && process.env.GUEST_SESSION_SECRET);
let client: CognitoIdentityProviderClient | null = null;
const cip = () => (client ??= new CognitoIdentityProviderClient({ region: region() }));

/** Step 1: make sure a Cognito user exists for the email (silent), then ask Cognito to send the code. */
export async function startEmailCode(email: string): Promise<{ session: string }> {
  const e = email.trim().toLowerCase();
  try { await cip().send(new AdminGetUserCommand({ UserPoolId: poolId()!, Username: e })); }
  catch (err) {
    if ((err as UserNotFoundException).name !== "UserNotFoundException") throw err;
    await cip().send(new AdminCreateUserCommand({ UserPoolId: poolId()!, Username: e, UserAttributes: [{ Name: "email", Value: e }, { Name: "email_verified", Value: "true" }], MessageAction: "SUPPRESS" }));
  }
  const r = await cip().send(new InitiateAuthCommand({ AuthFlow: "USER_AUTH", ClientId: clientId()!, AuthParameters: { USERNAME: e, PREFERRED_CHALLENGE: "EMAIL_OTP" } }));
  if (r.ChallengeName !== "EMAIL_OTP" || !r.Session) throw new Error(`Unexpected challenge ${r.ChallengeName ?? "none"}`);
  return { session: r.Session };
}

/** Step 2: verify the code; on success return the local guest row (created from the email if new). */
export async function verifyEmailCode(email: string, code: string, session: string) {
  const e = email.trim().toLowerCase();
  const r = await cip().send(new RespondToAuthChallengeCommand({ ClientId: clientId()!, ChallengeName: "EMAIL_OTP", Session: session, ChallengeResponses: { USERNAME: e, EMAIL_OTP_CODE: code.trim() } }));
  if (!r.AuthenticationResult?.IdToken) throw new Error("Code not accepted");
  const [existing] = await db.select().from(guests).where(eq(guests.email, e));
  if (existing) return existing;
  const [created] = await db.insert(guests).values({ email: e, name: null, phone: null, consentAt: new Date() }).returning();
  return created;
}
