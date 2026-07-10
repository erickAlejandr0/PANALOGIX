import { OAuth2Client } from "google-auth-library";

export type GoogleProfile = {
  googleId: string;
  email: string;
  emailVerified: boolean;
  picture?: string;
};
function getGoogleAudiences(): string[] {
  return [
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_IOS_CLIENT_ID,
    // proximamente se agregara el client id para android
    //process.env.GOOGLE_ANDROID_CLIENT_ID,  
  ].filter((id): id is string => !!id);
}


function getGoogleClientId(): string {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID environment variable is not defined");
  }
  return clientId;
}

function getGoogleClientSecret(): string {
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientSecret) {
    throw new Error("GOOGLE_CLIENT_SECRET environment variable is not defined");
  }
  return clientSecret;
}

function getGoogleRedirectUri(): string {
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!redirectUri) {
    throw new Error("GOOGLE_REDIRECT_URI environment variable is not defined");
  }
  return redirectUri;
}

export function getGoogleOAuth2Client(): OAuth2Client {
  return new OAuth2Client(
    getGoogleClientId(),
    getGoogleClientSecret(),
    getGoogleRedirectUri(),
  );
}

export function buildGoogleAuthUrl(state: string): string {
  const client = getGoogleOAuth2Client();
  return client.generateAuthUrl({
    access_type: "offline",
    scope: ["openid", "email", "profile"],
    state,
    prompt: "select_account",
  });
}

function toGoogleProfile(payload: {
  sub?: string | null;
  email?: string | null;
  email_verified?: boolean | null;
  picture?: string | null;
}): GoogleProfile | null {
  const googleId = payload.sub;
  const email = payload.email;

  if (!googleId || !email) {
    return null;
  }

  return {
    googleId,
    email,
    emailVerified: payload.email_verified === true,
    ...(payload.picture ? { picture: payload.picture } : {}),
  };
}

export async function exchangeCodeForProfile(
  code: string,
): Promise<GoogleProfile | null> {
  try {
    const client = getGoogleOAuth2Client();
    const { tokens } = await client.getToken(code);

    if (!tokens.id_token) {
      return null;
    }

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: getGoogleAudiences(),
    });

    return toGoogleProfile(ticket.getPayload() ?? {});
  } catch {
    return null;
  }
}

export async function verifyGoogleIdToken(
  idToken: string,
): Promise<GoogleProfile | null> {
  try {
    const client = getGoogleOAuth2Client();
    const ticket = await client.verifyIdToken({
      idToken,
      audience: getGoogleAudiences(),
    });

    return toGoogleProfile(ticket.getPayload() ?? {});
  } catch {
    return null;
  }
}
