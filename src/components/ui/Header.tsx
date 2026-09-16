"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export function Header({
  username,
  role,
}: {
  username: string;
  role: "ADMIN" | "PLAYER";
}) {
  const router = useRouter();

  async function logout() {
    await api.post("/api/auth/logout");
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="flex items-center justify-between border-b border-neutral-800 px-6 py-4">
      <Link href={role === "ADMIN" ? "/admin/users" : "/cases"} className="text-lg font-bold text-amber-400">
        Murdoku
      </Link>
      <nav className="flex items-center gap-4 text-sm">
        {role === "ADMIN" && (
          <>
            <Link href="/admin/users" className="text-neutral-300 hover:text-amber-400">
              Utilizadores
            </Link>
            <Link href="/admin/puzzles" className="text-neutral-300 hover:text-amber-400">
              Casos
            </Link>
          </>
        )}
        {role === "PLAYER" && (
          <Link href="/cases" className="text-neutral-300 hover:text-amber-400">
            Casos
          </Link>
        )}
        <span className="text-neutral-500">{username}</span>
        <button onClick={logout} className="text-neutral-300 hover:text-red-400">
          Sair
        </button>
      </nav>
    </header>
  );
}
