import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildAuthorizationUrl,
  completeStandaloneLaunch,
  discoverSmartEndpoints,
  exchangeCodeForToken,
  generatePkcePair,
  parseLaunchParams,
  startStandaloneLaunch,
} from "./smartAuth";

function createStorageMock(initial: Record<string, string> = {}) {
  const store: Record<string, string> = { ...initial };
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
  };
}

describe("parseLaunchParams", () => {
  it("extracts iss and launch from a query string", () => {
    const result = parseLaunchParams("?iss=https%3A%2F%2Ffhir.example.org%2Ffhir&launch=abc123");
    expect(result).toEqual({ iss: "https://fhir.example.org/fhir", launch: "abc123" });
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
      authorizationEndpoint: "https://fhir.example.org/oauth2/authorize",
      clientId: "client-123",
      redirectUri: "https://app.example.com/callback",
      scope: "launch openid fhirUser patient/*.read",
      launch: "abc123",
      iss: "https://fhir.example.org/fhir",
      state: "state-xyz",
      codeChallenge: "challenge-abc",
    });

    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe("https://fhir.example.org/oauth2/authorize");
    expect(parsed.searchParams.get("response_type")).toBe("code");
    expect(parsed.searchParams.get("client_id")).toBe("client-123");
    expect(parsed.searchParams.get("redirect_uri")).toBe("https://app.example.com/callback");
    expect(parsed.searchParams.get("scope")).toBe("launch openid fhirUser patient/*.read");
    expect(parsed.searchParams.get("launch")).toBe("abc123");
    expect(parsed.searchParams.get("aud")).toBe("https://fhir.example.org/fhir");
    expect(parsed.searchParams.get("state")).toBe("state-xyz");
    expect(parsed.searchParams.get("code_challenge")).toBe("challenge-abc");
    expect(parsed.searchParams.get("code_challenge_method")).toBe("S256");
  });

  it("omits the launch param for standalone launch (no launch value)", () => {
    const url = buildAuthorizationUrl({
      authorizationEndpoint: "https://fhir.example.org/oauth2/authorize",
      clientId: "client-123",
      redirectUri: "https://app.example.com/callback",
      scope: "launch/patient openid fhirUser patient/*.read",
      iss: "https://fhir.example.org/fhir",
      state: "state-xyz",
      codeChallenge: "challenge-abc",
    });

    expect(new URL(url).searchParams.has("launch")).toBe(false);
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
        authorization_endpoint: "https://fhir.example.org/oauth2/authorize",
        token_endpoint: "https://fhir.example.org/oauth2/token",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const endpoints = await discoverSmartEndpoints("https://fhir.example.org/fhir");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://fhir.example.org/fhir/.well-known/smart-configuration",
    );
    expect(endpoints).toEqual({
      authorizationEndpoint: "https://fhir.example.org/oauth2/authorize",
      tokenEndpoint: "https://fhir.example.org/oauth2/token",
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

    const result = await exchangeCodeForToken("https://fhir.example.org/oauth2/token", {
      code: "auth-code",
      redirectUri: "https://app.example.com/callback",
      clientId: "client-123",
      codeVerifier: "verifier-abc",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("https://fhir.example.org/oauth2/token");
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
      exchangeCodeForToken("https://fhir.example.org/oauth2/token", {
        code: "bad-code",
        redirectUri: "https://app.example.com/callback",
        clientId: "client-123",
        codeVerifier: "verifier-abc",
      }),
    ).rejects.toThrow("Failed to exchange code for token: 400 Bad Request");
  });
});

describe("startStandaloneLaunch", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("discovers endpoints, stores the PKCE verifier/state/fhirBaseUrl, and redirects to the authorization URL", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        authorization_endpoint: "https://fhir.example.org/oauth2/authorize",
        token_endpoint: "https://fhir.example.org/oauth2/token",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const storage = createStorageMock();
    vi.stubGlobal("sessionStorage", storage);

    const location = { assign: vi.fn() };
    vi.stubGlobal("location", location);

    await startStandaloneLaunch({
      fhirBaseUrl: "https://fhir.example.org/fhir",
      clientId: "client-123",
      redirectUri: "https://app.example.com/callback",
      scope: "launch/patient openid fhirUser patient/*.read",
    });

    expect(storage.setItem).toHaveBeenCalledTimes(1);
    const [key, storedValue] = storage.setItem.mock.calls[0];
    expect(key).toBe("smart_standalone_launch");
    const stored = JSON.parse(storedValue);
    expect(stored.fhirBaseUrl).toBe("https://fhir.example.org/fhir");
    expect(typeof stored.verifier).toBe("string");
    expect(typeof stored.state).toBe("string");

    expect(location.assign).toHaveBeenCalledTimes(1);
    const redirectUrl = new URL(location.assign.mock.calls[0][0]);
    expect(redirectUrl.origin + redirectUrl.pathname).toBe("https://fhir.example.org/oauth2/authorize");
    expect(redirectUrl.searchParams.get("state")).toBe(stored.state);
    expect(redirectUrl.searchParams.get("aud")).toBe("https://fhir.example.org/fhir");
    expect(redirectUrl.searchParams.has("launch")).toBe(false);
  });
});

describe("completeStandaloneLaunch", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("exchanges the code using the stored verifier and returns the token result", async () => {
    const storedState = "state-abc";
    const storage = createStorageMock({
      smart_standalone_launch: JSON.stringify({
        verifier: "verifier-xyz",
        state: storedState,
        fhirBaseUrl: "https://fhir.example.org/fhir",
      }),
    });
    vi.stubGlobal("sessionStorage", storage);

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          authorization_endpoint: "https://fhir.example.org/oauth2/authorize",
          token_endpoint: "https://fhir.example.org/oauth2/token",
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ access_token: "token-abc", patient: "pt-1" }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const result = await completeStandaloneLaunch(`?code=auth-code&state=${storedState}`, {
      clientId: "client-123",
      redirectUri: "https://app.example.com/callback",
    });

    expect(result).toEqual({
      accessToken: "token-abc",
      patientId: "pt-1",
      fhirBaseUrl: "https://fhir.example.org/fhir",
    });
    expect(storage.removeItem).toHaveBeenCalledWith("smart_standalone_launch");
  });

  it("throws when the callback state does not match the stored state", async () => {
    const storage = createStorageMock({
      smart_standalone_launch: JSON.stringify({
        verifier: "verifier-xyz",
        state: "expected-state",
        fhirBaseUrl: "https://fhir.example.org/fhir",
      }),
    });
    vi.stubGlobal("sessionStorage", storage);

    await expect(
      completeStandaloneLaunch("?code=auth-code&state=wrong-state", {
        clientId: "client-123",
        redirectUri: "https://app.example.com/callback",
      }),
    ).rejects.toThrow("State mismatch in standalone launch callback");
  });

  it("throws when there is no stored launch state", async () => {
    vi.stubGlobal("sessionStorage", createStorageMock());

    await expect(
      completeStandaloneLaunch("?code=auth-code&state=state-abc", {
        clientId: "client-123",
        redirectUri: "https://app.example.com/callback",
      }),
    ).rejects.toThrow("Missing standalone launch callback parameters or stored launch state");
  });
});
