"use client";

import { useEffect, useState } from "react";
import type { UserDTO } from "@vmf/shared";
import { apiFetch, ApiError } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface PaginatedUsers {
  items: UserDTO[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function AdminUsersPage() {
  const [data, setData] = useState<PaginatedUsers | null>(null);
  const [q, setQ] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async (search: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      const result = await apiFetch<PaginatedUsers>(`/users?${params.toString()}`);
      setData(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao carregar usuários");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load("");
  }, []);

  const updateUser = async (user: UserDTO, patch: Partial<Pick<UserDTO, "role" | "status">>) => {
    try {
      await apiFetch(`/users/${user.id}`, { method: "PATCH", body: patch });
      await load(q);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Erro ao atualizar usuário");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-ink-950">Usuários</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            load(q);
          }}
          className="w-64"
        >
          <Input placeholder="Buscar por nome ou e-mail" value={q} onChange={(e) => setQ(e.target.value)} />
        </form>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-surface-border text-ink-500">
            <tr>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">E-mail</th>
              <th className="px-4 py-3 font-medium">Papel</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-ink-500">
                  Carregando...
                </td>
              </tr>
            )}
            {!isLoading && data?.items.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-ink-500">
                  Nenhum usuário encontrado.
                </td>
              </tr>
            )}
            {data?.items.map((user) => (
              <tr key={user.id} className="border-b border-surface-border/60">
                <td className="px-4 py-3 text-ink-950">{user.name}</td>
                <td className="px-4 py-3 text-ink-600">{user.email}</td>
                <td className="px-4 py-3">
                  <Select
                    value={user.role}
                    onChange={(e) => updateUser(user, { role: e.target.value as UserDTO["role"] })}
                    className="w-32"
                  >
                    <option value="MEMBER">Membro</option>
                    <option value="ADMIN">Admin</option>
                  </Select>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Badge tone={user.status === "ACTIVE" ? "success" : "danger"}>
                      {user.status === "ACTIVE" ? "Ativo" : "Inativo"}
                    </Badge>
                    <button
                      onClick={() =>
                        updateUser(user, { status: user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" })
                      }
                      className="text-xs text-gold-700 hover:underline"
                    >
                      {user.status === "ACTIVE" ? "Desativar" : "Ativar"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
