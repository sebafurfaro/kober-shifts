import { google } from "googleapis";

function getOAuth2Client(redirectUri?: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const resolvedRedirectUri = redirectUri ?? process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !resolvedRedirectUri) {
    throw new Error("Missing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REDIRECT_URI");
  }

  return new google.auth.OAuth2(clientId, clientSecret, resolvedRedirectUri);
}

/** Scopes for plataforma (includes calendar). */
const PLATAFORMA_SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "openid",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

/** Scopes for store login (only email/profile). */
const STORE_SCOPES = [
  "openid",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

export function getGoogleAuthUrl(state: string, redirectUri?: string) {
  const oauth2 = getOAuth2Client(redirectUri);
  return oauth2.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: PLATAFORMA_SCOPES,
    state,
  });
}

/** Auth URL for store login (email/profile only, no calendar). */
export function getGoogleAuthUrlForStore(state: string, redirectUri: string) {
  const oauth2 = getOAuth2Client(redirectUri);
  return oauth2.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: STORE_SCOPES,
    state,
    redirect_uri: redirectUri,
  });
}

export async function exchangeCodeForTokens(code: string, redirectUri?: string) {
  const oauth2 = getOAuth2Client(redirectUri);
  const { tokens } = await oauth2.getToken(code);
  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error("Google did not return refresh_token (try re-consenting)");
  }
  return tokens;
}

/** Exchange code for tokens; only requires id_token (for store login). */
export async function exchangeCodeForStoreLogin(code: string, redirectUri: string) {
  const oauth2 = getOAuth2Client(redirectUri);
  const { tokens } = await oauth2.getToken(code);
  if (!tokens.id_token) {
    throw new Error("Google did not return id_token");
  }
  return tokens;
}

export async function getCalendarClient(accessToken: string, refreshToken: string) {
  const oauth2 = getOAuth2Client();
  oauth2.setCredentials({ access_token: accessToken, refresh_token: refreshToken });
  return google.calendar({ version: "v3", auth: oauth2 });
}


