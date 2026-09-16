"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api, ApiClientError } from "@/lib/api";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirm) {
      setError("As palavras-passe não coincidem.");
      return;
    }
    if (newPassword.length < 8) {
      setError("A nova palavra-passe precisa de pelo menos 8 caracteres.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/api/auth/change-password", { currentPassword, newPassword });
      router.replace("/login");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Erro ao mudar a palavra-passe.");
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
        <div>
          <h1 className="text-xl font-bold text-amber-400">Define uma nova palavra-passe</h1>
          <p className="mt-1 text-sm text-neutral-400">
            É a primeira vez que entras, ou a tua palavra-passe foi reposta. Escolhe uma nova.
          </p>
        </div>

        <div className="space-y-1">
          <label htmlFor="currentPassword" className="text-sm text-neutral-300">
            Palavra-passe atual
          </label>
          <input
            id="currentPassword"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 outline-none focus:border-amber-500"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="newPassword" className="text-sm text-neutral-300">
            Nova palavra-passe
          </label>
          <input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 outline-none focus:border-amber-500"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="confirm" className="text-sm text-neutral-300">
            Confirmar nova palavra-passe
          </label>
          <input
            id="confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
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
          {loading ? "A guardar..." : "Guardar e entrar novamente"}
        </button>
      </form>
    </div>
  );
}
