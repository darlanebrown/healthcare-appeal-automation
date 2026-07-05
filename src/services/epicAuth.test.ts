import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildAuthorizationUrl,
  discoverSmartEndpoints,
  exchangeCodeForToken,
  generatePkcePair,
  parseLaunchParams,
} from "./epicAuth";

describe("parseLaunchParams", () => {
  it("extracts iss and launch from a query string", () => {
    const result = parseLaunchParams("?iss=https%3A%2F%2Fepic.example.org%2Ffhir&launch=abc123");
    expect(result).toEqual({ iss: "https://epic.example.org/fhir", launch: "abc123" });
  });

  it("returns nulls when the params are missing", () => {
    expect(parseLaunchParams("")).toEqual({ iss: null, launch: null });
  });
});

describe("generatePkcePair", () => {
  it("returns a verifier and a challenge derived from it", async () => {
    const pair = await generatePkcePair();

    expect(pair.verifier.length).toBeGreaterThanOrEqual(43);
    expect(pair.challenge.length).toBeGreaterThan(0);
    expect(pair.challenge).not.toContain("=");
    expect(pair.challenge).not.toContain("+");
    expect(pair.challenge).not.toContain("/");
  });

  it("generates a different verifier on each call", async () => {
    const [a, b] = await Promise.all([generatePkcePair(), generatePkcePair()]);
    expect(a.verifier).not.toBe(b.verifier);
  });
});

describe("buildAuthorizationUrl", () => {
  it("builds a PKCE authorization URL with the SMART launch params", () => {
    const url = buildAuthorizationUrl({
      authorizationEndpoint: "https://epic.example.org/oauth2/authorize",
      clientId: "client-123",
      redirectUri: "https://app.example.com/callback",
      scope: "launch openid fhirUser patient/*.read",
      launch: "abc123",
      iss: "https://epic.example.org/fhir",
      state: "state-xyz",
      codeChallenge: "challenge-abc",
    });

    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe("https://epic.example.org/oauth2/authorize");
    expect(parsed.searchParams.get("response_type")).toBe("code");
    expect(parsed.searchParams.get("client_id")).toBe("client-123");
    expect(parsed.searchParams.get("redirect_uri")).toBe("https://app.example.com/callback");
    expect(parsed.searchParams.get("scope")).toBe("launch openid fhirUser patient/*.read");
    expect(parsed.searchParams.get("launch")).toBe("abc123");
    expect(parsed.searchParams.get("aud")).toBe("https://epic.example.org/fhir");
    expect(parsed.searchParams.get("state")).toBe("state-xyz");
    expect(parsed.searchParams.get("code_challenge")).toBe("challenge-abc");
    expect(parsed.searchParams.get("code_challenge_method")).toBe("S256");
  });
});

describe("discoverSmartEndpoints", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetches the SMART configuration and returns the auth/token endpoints", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        authorization_endpoint: "https://epic.example.org/oauth2/authorize",
        token_endpoint: "https://epic.example.org/oauth2/token",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const endpoints = await discoverSmartEndpoints("https://epic.example.org/fhir");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://epic.example.org/fhir/.well-known/smart-configuration",
    );
    expect(endpoints).toEqual({
      authorizationEndpoint: "https://epic.example.org/oauth2/authorize",
      tokenEndpoint: "https://epic.example.org/oauth2/token",
    });
  });
});

describe("exchangeCodeForToken", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("POSTs the authorization_code grant with the PKCE verifier and returns the token", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ access_token: "token-abc", patient: "pt-1", expires_in: 3600 }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await exchangeCodeForToken("https://epic.example.org/oauth2/token", {
      code: "auth-code",
      redirectUri: "https://app.example.com/callback",
      clientId: "client-123",
      codeVerifier: "verifier-abc",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("https://epic.example.org/oauth2/token");
    expect(options.method).toBe("POST");
    expect(options.headers).toEqual({ "Content-Type": "application/x-www-form-urlencoded" });

    const body = new URLSearchParams(options.body);
    expect(body.get("grant_type")).toBe("authorization_code");
    expect(body.get("code")).toBe("auth-code");
    expect(body.get("redirect_uri")).toBe("https://app.example.com/callback");
    expect(body.get("client_id")).toBe("client-123");
    expect(body.get("code_verifier")).toBe("verifier-abc");

    expect(result).toEqual({ access_token: "token-abc", patient: "pt-1", expires_in: 3600 });
  });

  it("throws when the token endpoint responds with an error", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 400, statusText: "Bad Request" });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      exchangeCodeForToken("https://epic.example.org/oauth2/token", {
        code: "bad-code",
        redirectUri: "https://app.example.com/callback",
        clientId: "client-123",
        codeVerifier: "verifier-abc",
      }),
    ).rejects.toThrow("Failed to exchange code for token: 400 Bad Request");
  });
});
