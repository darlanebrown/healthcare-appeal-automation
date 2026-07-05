import type { EpicTokenResponse, PkcePair, SmartEndpoints, SmartLaunchParams } from "../types/epic";

export function parseLaunchParams(search: string): SmartLaunchParams {
  const params = new URLSearchParams(search);
  return {
    iss: params.get("iss"),
    launch: params.get("launch"),
  };
}

function base64UrlEncode(bytes: ArrayBuffer): string {
  const binary = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function generatePkcePair(): Promise<PkcePair> {
  const verifierBytes = crypto.getRandomValues(new Uint8Array(32));
  const verifier = base64UrlEncode(verifierBytes.buffer);

  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  const challenge = base64UrlEncode(digest);

  return { verifier, challenge };
}

export function buildAuthorizationUrl(params: {
  authorizationEndpoint: string;
  clientId: string;
  redirectUri: string;
  scope: string;
  launch: string;
  iss: string;
  state: string;
  codeChallenge: string;
}): string {
  const url = new URL(params.authorizationEndpoint);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", params.clientId);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("scope", params.scope);
  url.searchParams.set("launch", params.launch);
  url.searchParams.set("aud", params.iss);
  url.searchParams.set("state", params.state);
  url.searchParams.set("code_challenge", params.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

export async function discoverSmartEndpoints(fhirBaseUrl: string): Promise<SmartEndpoints> {
  const response = await fetch(`${fhirBaseUrl}/.well-known/smart-configuration`);
  const config = await response.json();
  return {
    authorizationEndpoint: config.authorization_endpoint,
    tokenEndpoint: config.token_endpoint,
  };
}

export async function exchangeCodeForToken(
  tokenEndpoint: string,
  params: { code: string; redirectUri: string; clientId: string; codeVerifier: string },
): Promise<EpicTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: params.code,
    redirect_uri: params.redirectUri,
    client_id: params.clientId,
    code_verifier: params.codeVerifier,
  });

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error(`Failed to exchange code for token: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
