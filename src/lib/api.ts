export class ApiClientError extends Error {}

interface Envelope<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    credentials: "same-origin",
  });
  const body = (await res.json()) as Envelope<T>;
  if (!res.ok || !body.ok) {
    throw new ApiClientError(body.error ?? `Pedido falhou (${res.status})`);
  }
  return body.data as T;
}

export const api = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, payload?: unknown) =>
    request<T>(url, { method: "POST", body: payload ? JSON.stringify(payload) : undefined }),
  patch: <T>(url: string, payload?: unknown) =>
    request<T>(url, { method: "PATCH", body: payload ? JSON.stringify(payload) : undefined }),
  delete: <T>(url: string) => request<T>(url, { method: "DELETE" }),
};
