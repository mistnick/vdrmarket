/**
 * OAuth2/OpenID Connect Configuration
 * Supporta Keycloak, Authentik, e altri provider OIDC compatibili
 */

/**
 * Genera un code verifier per PKCE (Edge Runtime compatible)
 */
export function generateCodeVerifier(): string {
  // Generate random bytes using crypto.getRandomValues (Edge compatible)
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  // Convert to base64url
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

/**
 * Genera il code challenge per PKCE (Edge Runtime compatible)
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  // Use SubtleCrypto for SHA-256 hashing (Edge compatible)
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = new Uint8Array(hashBuffer);
  // Convert to base64url
  return btoa(String.fromCharCode(...hashArray))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

export interface OAuthConfig {
  issuer: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  postLogoutRedirectUri: string;
  scope: string;
  responseType: string;
  grantType: string;
}

export const oauthConfig: OAuthConfig = {
  // Issuer URL (Keycloak realm endpoint o Authentik application endpoint)
  issuer:
    process.env.OAUTH_ISSUER ||
    process.env.AUTHENTIK_ISSUER ||
    "https://keycloak.example.com/realms/dataroom",

  // Client credentials
  clientId:
    process.env.OAUTH_CLIENT_ID ||
    process.env.AUTHENTIK_CLIENT_ID ||
    "dataroom-client",

  clientSecret:
    process.env.OAUTH_CLIENT_SECRET ||
    process.env.AUTHENTIK_CLIENT_SECRET ||
    "",

  // Redirect URIs
  redirectUri:
    process.env.OAUTH_REDIRECT_URI ||
    `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/auth/callback`,

  postLogoutRedirectUri:
    process.env.OAUTH_POST_LOGOUT_REDIRECT_URI ||
    `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/auth/login`,

  // OAuth2 parameters
  scope: process.env.OAUTH_SCOPE || "openid profile email",
  responseType: "code",
  grantType: "authorization_code",
};

/**
 * Genera l'URL di autorizzazione OAuth2 con PKCE
 */
export function getAuthorizationUrl(state?: string, codeChallenge?: string): string {
  const params = new URLSearchParams({
    client_id: oauthConfig.clientId,
    redirect_uri: oauthConfig.redirectUri,
    response_type: oauthConfig.responseType,
    scope: oauthConfig.scope,
    ...(state && { state }),
    ...(codeChallenge && {
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    }),
  });

  return `${oauthConfig.issuer}/protocol/openid-connect/auth?${params.toString()}`;
}

/**
 * Genera l'URL di logout OAuth2
 */
export function getLogoutUrl(idToken?: string): string {
  const params = new URLSearchParams({
    client_id: oauthConfig.clientId,
    post_logout_redirect_uri: oauthConfig.postLogoutRedirectUri,
    ...(idToken && { id_token_hint: idToken }),
  });

  return `${oauthConfig.issuer}/protocol/openid-connect/logout?${params.toString()}`;
}

/**
 * Ottiene l'endpoint del token OAuth2
 */
export function getTokenEndpoint(): string {
  return `${oauthConfig.issuer}/protocol/openid-connect/token`;
}

/**
 * Ottiene l'endpoint JWKS per la verifica dei token
 */
export function getJwksEndpoint(): string {
  return `${oauthConfig.issuer}/protocol/openid-connect/certs`;
}

/**
 * Verifica se OAuth2 è configurato correttamente
 */
export function isOAuthConfigured(): boolean {
  return !!(
    oauthConfig.issuer &&
    oauthConfig.clientId &&
    oauthConfig.clientSecret &&
    !oauthConfig.issuer.includes("example.com")
  );
}
