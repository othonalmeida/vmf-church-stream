"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { churchInputSchema, type ChurchInput, type ChurchDTO } from "@vmf/shared";
import { apiFetch, ApiError } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/contexts/toast-context";
import { useConfirm } from "@/contexts/confirm-context";

export default function AdminSettingsPage() {
  const [churches, setChurches] = useState<ChurchDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ChurchDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const confirm = useConfirm();

  const load = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch<{ churches: ChurchDTO[] }>("/churches");
      setChurches(data.churches);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao carregar igrejas");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (church: ChurchDTO) => {
    setEditing(church);
    setModalOpen(true);
  };

  const handleDelete = async (church: ChurchDTO) => {
    if (!(await confirm(`Remover a igreja "${church.name}"?`))) return;
    try {
      await apiFetch(`/churches/${church.id}`, { method: "DELETE" });
      await load();
      toast.success("Igreja removida.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao remover igreja");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-ink-950">Igrejas</h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nova igreja
        </Button>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-surface-border text-ink-500">
            <tr>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={2} className="px-4 py-6 text-center text-ink-500">
                  Carregando...
                </td>
              </tr>
            )}
            {!isLoading && churches.length === 0 && (
              <tr>
                <td colSpan={2} className="px-4 py-6 text-center text-ink-500">
                  Nenhuma igreja cadastrada.
                </td>
              </tr>
            )}
            {churches.map((church) => (
              <tr key={church.id} className="border-b border-surface-border/60">
                <td className="px-4 py-3 text-ink-950">{church.name}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => openEdit(church)} className="mr-2 rounded p-1.5 text-ink-600 hover:bg-surface-border hover:text-ink-950">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(church)} className="rounded p-1.5 text-ink-600 hover:bg-red-100 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <ChurchFormModal
        open={modalOpen}
        church={editing}
        onClose={() => setModalOpen(false)}
        onSaved={async () => {
          setModalOpen(false);
          await load();
        }}
      />
    </div>
  );
}

function ChurchFormModal({
  open,
  church,
  onClose,
  onSaved,
}: {
  open: boolean;
  church: ChurchDTO | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChurchInput>({ resolver: zodResolver(churchInputSchema) });
  const toast = useToast();

  useEffect(() => {
    reset(church ? { name: church.name } : { name: "" });
  }, [church, reset, open]);

  const onSubmit = async (data: ChurchInput) => {
    try {
      if (church) {
        await apiFetch(`/churches/${church.id}`, { method: "PATCH", body: data });
      } else {
        await apiFetch("/churches", { method: "POST", body: data });
      }
      onSaved();
      toast.success("Igreja salva com sucesso.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao salvar igreja");
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={church ? "Editar igreja" : "Nova igreja"}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input label="Nome" error={errors.name?.message} {...register("name")} />
        <Button type="submit" isLoading={isSubmitting} className="self-end">
          Salvar
        </Button>
      </form>
    </Modal>
  );
}
