/**
 * Token verification and management utilities
 */

import { jwtVerify, createRemoteJWKSet, JWTPayload } from "jose";
import { getJwksEndpoint, oauthConfig } from "./oauth.config";

export interface TokenPayload extends JWTPayload {
  sub: string;
  email?: string;
  name?: string;
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  realm_access?: {
    roles: string[];
  };
  resource_access?: {
    [key: string]: {
      roles: string[];
    };
  };
}

/**
 * Verifica un JWT usando il JWKS endpoint del provider
 */
export async function verifyToken(token: string): Promise<TokenPayload> {
  try {
    const JWKS = createRemoteJWKSet(new URL(getJwksEndpoint()));

    const { payload } = await jwtVerify(token, JWKS, {
      issuer: oauthConfig.issuer,
      audience: oauthConfig.clientId,
    });

    return payload as TokenPayload;
  } catch (error) {
    console.error("Token verification failed:", error);
    throw new Error("Invalid token");
  }
}

/**
 * Scambia il code OAuth2 per i token con PKCE
 */
export async function exchangeCodeForTokens(
  code: string,
  codeVerifier?: string
): Promise<{
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  expires_in: number;
}> {
  const tokenEndpoint = `${oauthConfig.issuer}/protocol/openid-connect/token`;

  const params = new URLSearchParams({
    grant_type: oauthConfig.grantType,
    code,
    redirect_uri: oauthConfig.redirectUri,
    client_id: oauthConfig.clientId,
    client_secret: oauthConfig.clientSecret,
    ...(codeVerifier && { code_verifier: codeVerifier }),
  });

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Token exchange failed:", error);
    throw new Error("Failed to exchange code for tokens");
  }

  return response.json();
}

/**
 * Rinnova un access token usando il refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}> {
  const tokenEndpoint = `${oauthConfig.issuer}/protocol/openid-connect/token`;

  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: oauthConfig.clientId,
    client_secret: oauthConfig.clientSecret,
  });

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error("Failed to refresh token");
  }

  return response.json();
}

/**
 * Decodifica un JWT senza verificarlo (per ispezione rapida)
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = JSON.parse(
      Buffer.from(parts[1], "base64").toString("utf-8")
    );
    return payload as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Verifica se un token è scaduto
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) return true;

  const now = Math.floor(Date.now() / 1000);
  return payload.exp < now;
}
