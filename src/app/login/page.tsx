"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, ApiClientError } from "@/lib/api";

interface LoginResponse {
  id: string;
  username: string;
  role: "ADMIN" | "PLAYER";
  mustChangePassword: boolean;
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await api.post<LoginResponse>("/api/auth/login", { username, password });
      const next = params.get("next");
      if (user.mustChangePassword) {
        router.replace("/change-password");
      } else {
        router.replace(next ?? (user.role === "ADMIN" ? "/admin/users" : "/cases"));
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Erro ao iniciar sessão.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-5 rounded-2xl border border-neutral-800 bg-neutral-900 p-8 shadow-xl"
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-amber-400">Murdoku</h1>
          <p className="mt-1 text-sm text-neutral-400">Inicia sessão para resolver um caso.</p>
        </div>

        <div className="space-y-1">
          <label htmlFor="username" className="text-sm text-neutral-300">
            Utilizador
          </label>
          <input
            id="username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 outline-none focus:border-amber-500"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="text-sm text-neutral-300">
            Palavra-passe
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 outline-none focus:border-amber-500"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-amber-500 px-4 py-2 font-semibold text-neutral-950 transition hover:bg-amber-400 disabled:opacity-50"
        >
          {loading ? "A entrar..." : "Entrar"}
        </button>

        <p className="text-center text-xs text-neutral-500">
          As contas são criadas por um administrador. Fala com o teu admin se não tiveres acesso.
        </p>
      </form>
    </div>
  );
}
