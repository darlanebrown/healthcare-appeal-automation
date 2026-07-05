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
  launch?: string;
  iss: string;
  state: string;
  codeChallenge: string;
}): string {
  const url = new URL(params.authorizationEndpoint);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", params.clientId);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("scope", params.scope);
  if (params.launch) {
    url.searchParams.set("launch", params.launch);
  }
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

const STANDALONE_LAUNCH_STORAGE_KEY = "epic_standalone_launch";

export type StandaloneLaunchConfig = {
  fhirBaseUrl: string;
  clientId: string;
  redirectUri: string;
  scope: string;
};

export type StandaloneLaunchResult = {
  accessToken: string;
  patientId?: string;
  fhirBaseUrl: string;
};

export async function startStandaloneLaunch(config: StandaloneLaunchConfig): Promise<void> {
  const { authorizationEndpoint } = await discoverSmartEndpoints(config.fhirBaseUrl);
  const { verifier, challenge } = await generatePkcePair();
  const state = crypto.randomUUID();

  sessionStorage.setItem(
    STANDALONE_LAUNCH_STORAGE_KEY,
    JSON.stringify({ verifier, state, fhirBaseUrl: config.fhirBaseUrl }),
  );

  const url = buildAuthorizationUrl({
    authorizationEndpoint,
    clientId: config.clientId,
    redirectUri: config.redirectUri,
    scope: config.scope,
    iss: config.fhirBaseUrl,
    state,
    codeChallenge: challenge,
  });

  location.assign(url);
}

export async function completeStandaloneLaunch(
  callbackSearch: string,
  config: { clientId: string; redirectUri: string },
): Promise<StandaloneLaunchResult> {
  const params = new URLSearchParams(callbackSearch);
  const code = params.get("code");
  const state = params.get("state");
  const stored = sessionStorage.getItem(STANDALONE_LAUNCH_STORAGE_KEY);

  if (!code || !state || !stored) {
    throw new Error("Missing standalone launch callback parameters or stored launch state");
  }

  const { verifier, state: storedState, fhirBaseUrl } = JSON.parse(stored);

  if (state !== storedState) {
    throw new Error("State mismatch in standalone launch callback");
  }

  const { tokenEndpoint } = await discoverSmartEndpoints(fhirBaseUrl);
  const token = await exchangeCodeForToken(tokenEndpoint, {
    code,
    redirectUri: config.redirectUri,
    clientId: config.clientId,
    codeVerifier: verifier,
  });

  sessionStorage.removeItem(STANDALONE_LAUNCH_STORAGE_KEY);

  return { accessToken: token.access_token, patientId: token.patient, fhirBaseUrl };
}
