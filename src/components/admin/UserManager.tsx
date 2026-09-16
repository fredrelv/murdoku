"use client";

import { useState, type FormEvent } from "react";
import { api, ApiClientError } from "@/lib/api";

interface AdminUser {
  id: string;
  username: string;
  displayName: string | null;
  role: "ADMIN" | "PLAYER";
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
}

export function UserManager({ initialUsers, currentUserId }: { initialUsers: AdminUser[]; currentUserId: string }) {
  const [users, setUsers] = useState(initialUsers);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<"ADMIN" | "PLAYER">("PLAYER");
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [lastTempPassword, setLastTempPassword] = useState<{ username: string; password: string } | null>(null);

  async function refresh() {
    const list = await api.get<AdminUser[]>("/api/admin/users");
    setUsers(list);
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setCreating(true);
    try {
      const result = await api.post<{ user: AdminUser; tempPassword: string }>("/api/admin/users", {
        username,
        displayName: displayName || undefined,
        role,
      });
      setLastTempPassword({ username: result.user.username, password: result.tempPassword });
      setUsername("");
      setDisplayName("");
      setRole("PLAYER");
      await refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Erro ao criar utilizador.");
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleActive(user: AdminUser) {
    setError(null);
    try {
      await api.patch(`/api/admin/users/${user.id}`, { isActive: !user.isActive });
      await refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Erro ao atualizar utilizador.");
    }
  }

  async function handleResetPassword(user: AdminUser) {
    setError(null);
    try {
      const result = await api.patch<{ user: AdminUser; tempPassword?: string }>(`/api/admin/users/${user.id}`, {
        resetPassword: true,
      });
      if (result.tempPassword) setLastTempPassword({ username: user.username, password: result.tempPassword });
      await refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Erro ao repor palavra-passe.");
    }
  }

  async function handleDelete(user: AdminUser) {
    setError(null);
    try {
      await api.delete(`/api/admin/users/${user.id}`);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Erro ao eliminar utilizador.");
    }
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={handleCreate}
        className="flex flex-wrap items-end gap-3 rounded-xl border border-neutral-800 bg-neutral-900 p-4"
      >
        <div className="space-y-1">
          <label className="text-xs text-neutral-400">Utilizador</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-1.5 text-sm text-neutral-100"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-neutral-400">Nome (opcional)</label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-1.5 text-sm text-neutral-100"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-neutral-400">Papel</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "ADMIN" | "PLAYER")}
            className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-1.5 text-sm text-neutral-100"
          >
            <option value="PLAYER">Jogador</option>
            <option value="ADMIN">Administrador</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={creating}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-neutral-950 hover:bg-amber-400 disabled:opacity-50"
        >
          {creating ? "A criar..." : "Criar utilizador"}
        </button>
      </form>

      {lastTempPassword && (
        <p className="rounded-lg border border-amber-800 bg-amber-950/40 px-4 py-3 text-sm text-amber-300">
          Palavra-passe temporária para <strong>{lastTempPassword.username}</strong>:{" "}
          <code className="rounded bg-neutral-900 px-2 py-0.5">{lastTempPassword.password}</code> — copia agora,
          não será mostrada novamente.
        </p>
      )}
      {error && <p className="text-sm text-red-400">{error}</p>}

      <table className="w-full text-left text-sm">
        <thead className="text-neutral-500">
          <tr>
            <th className="pb-2">Utilizador</th>
            <th className="pb-2">Papel</th>
            <th className="pb-2">Estado</th>
            <th className="pb-2">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800">
          {users.map((u) => (
            <tr key={u.id}>
              <td className="py-2 text-neutral-200">
                {u.username}
                {u.displayName && <span className="text-neutral-500"> ({u.displayName})</span>}
              </td>
              <td className="py-2 text-neutral-400">{u.role === "ADMIN" ? "Administrador" : "Jogador"}</td>
              <td className="py-2">
                <span className={u.isActive ? "text-emerald-400" : "text-neutral-600"}>
                  {u.isActive ? "Ativo" : "Desativado"}
                </span>
              </td>
              <td className="space-x-3 py-2">
                <button onClick={() => handleToggleActive(u)} className="text-neutral-400 hover:text-amber-400">
                  {u.isActive ? "Desativar" : "Ativar"}
                </button>
                <button onClick={() => handleResetPassword(u)} className="text-neutral-400 hover:text-amber-400">
                  Repor palavra-passe
                </button>
                {u.id !== currentUserId && (
                  <button onClick={() => handleDelete(u)} className="text-neutral-400 hover:text-red-400">
                    Eliminar
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
