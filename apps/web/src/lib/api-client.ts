const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export class ApiError extends Error {
  status: number;
  issues?: unknown;
  constructor(message: string, status: number, issues?: unknown) {
    super(message);
    this.status = status;
    this.issues = issues;
    this.name = "ApiError";
  }
}

type TokenGetter = () => string | null;
type TokenSetter = (token: string | null) => void;

let getAccessToken: TokenGetter = () => null;
let setAccessTokenGlobal: TokenSetter = () => {};
let refreshPromise: Promise<string | null> | null = null;

export function configureApiClient(getter: TokenGetter, setter: TokenSetter) {
  getAccessToken = getter;
  setAccessTokenGlobal = setter;
}

export function getCurrentAccessToken(): string | null {
  return getAccessToken();
}

export { API_URL };

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) {
          setAccessTokenGlobal(null);
          return null;
        }
        const data = await res.json();
        setAccessTokenGlobal(data.accessToken);
        return data.accessToken as string;
      })
      .catch(() => {
        setAccessTokenGlobal(null);
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  skipAuthRetry?: boolean;
}

export async function apiFetch<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, skipAuthRetry, ...rest } = options;
  const token = getAccessToken();

  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  const doFetch = (accessToken: string | null) =>
    fetch(`${API_URL}${path}`, {
      ...rest,
      credentials: "include",
      headers: {
        // So define Content-Type: application/json quando realmente ha um
        // corpo JSON sendo enviado. Setar esse header sem corpo (comum em
        // DELETE/GET) faz o Chrome recente rejeitar o fetch com
        // "Body cannot be empty when content-type is set to 'application/json'".
        ...(body !== undefined && !isFormData ? { "Content-Type": "application/json" } : {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
    });

  let response = await doFetch(token);

  if (response.status === 401 && !skipAuthRetry) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      response = await doFetch(newToken);
    }
  }

  if (!response.ok) {
    let payload: { message?: string; issues?: unknown } = {};
    try {
      payload = await response.json();
    } catch {
      // ignore body parse errors
    }
    throw new ApiError(payload.message || response.statusText, response.status, payload.issues);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
