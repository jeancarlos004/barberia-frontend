const ACCESS_KEY = "barberia-access";
const REFRESH_KEY = "barberia-refresh";

export function getApiBase() {
  const raw = import.meta.env["VITE_API_URL"] as string | undefined;
  return (raw ?? "http://127.0.0.1:8000").replace(/\/$/, "");
}

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

function storageGet(key: string) {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(key);
}

function storageSet(key: string, value: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, value);
}

function storageRemove(key: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(key);
}

export function getAccessToken() {
  return storageGet(ACCESS_KEY);
}

export function getRefreshToken() {
  return storageGet(REFRESH_KEY);
}

export function setTokens(access: string, refresh?: string | null) {
  storageSet(ACCESS_KEY, access);
  if (refresh) storageSet(REFRESH_KEY, refresh);
}

export function clearTokens() {
  storageRemove(ACCESS_KEY);
  storageRemove(REFRESH_KEY);
}

export function flattenError(body: unknown, fallback = "No se pudo completar la acción.") {
  if (!body) return fallback;
  if (typeof body === "string") return body;
  if (typeof body !== "object") return fallback;
  const o = body as Record<string, unknown>;
  if (typeof o["detail"] === "string") {
    if (o["detail"].toLowerCase().includes("no active account")) {
      return "Correo o contraseña incorrectos.";
    }
    return o["detail"];
  }
  if (Array.isArray(o["non_field_errors"]) && o["non_field_errors"].length) {
    return String(o["non_field_errors"][0]);
  }
  const parts: string[] = [];
  for (const [key, value] of Object.entries(o)) {
    if (key === "detail") continue;
    if (Array.isArray(value)) parts.push(value.map(String).join(" "));
    else if (typeof value === "string") parts.push(value);
  }
  return parts.join(" ") || fallback;
}

async function readBody(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

let refreshInFlight: Promise<boolean> | null = null;

async function refreshAccess() {
  const refresh = getRefreshToken();
  if (!refresh) return false;
  const res = await fetch(`${getApiBase()}/api/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
  const data = (await readBody(res)) as { access?: string; refresh?: string } | null;
  if (!res.ok || !data?.access) {
    clearTokens();
    return false;
  }
  setTokens(data.access, data.refresh ?? refresh);
  return true;
}

export async function api<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body != null && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const access = getAccessToken();
  if (access) headers.set("Authorization", `Bearer ${access}`);

  const res = await fetch(`${getApiBase()}${path}`, { ...init, headers });

  if (res.status === 401 && retry && !path.startsWith("/api/auth/")) {
    if (!refreshInFlight) {
      refreshInFlight = refreshAccess().finally(() => {
        refreshInFlight = null;
      });
    }
    const ok = await refreshInFlight;
    if (ok) return api<T>(path, init, false);
  }

  const data = await readBody(res);
  if (!res.ok) {
    throw new ApiError(flattenError(data), res.status, data);
  }
  return (data ?? null) as T;
}
