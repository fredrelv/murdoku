import { requireAdminForPage } from "@/server/auth/pageGuards";
import { listUsers } from "@/server/services/users.service";
import { Header } from "@/components/ui/Header";
import { UserManager } from "@/components/admin/UserManager";

export default async function AdminUsersPage() {
  const admin = await requireAdminForPage();
  const users = await listUsers();

  return (
    <div className="flex flex-1 flex-col">
      <Header username={admin.username} role={admin.role} />
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
        <h1 className="mb-6 text-2xl font-bold text-neutral-100">Utilizadores</h1>
        <UserManager
          initialUsers={users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }))}
          currentUserId={admin.id}
        />
      </main>
    </div>
  );
}
