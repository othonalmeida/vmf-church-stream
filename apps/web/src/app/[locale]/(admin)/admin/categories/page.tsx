"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { categoryInputSchema, type CategoryInput, type CategoryDTO, CONTENT_TYPES } from "@vmf/shared";
import { apiFetch, ApiError } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/contexts/toast-context";
import { useConfirm } from "@/contexts/confirm-context";

const CONTENT_TYPE_LABELS: Record<string, string> = {
  VIDEO: "Vídeo",
  TEXT: "Texto",
  TRAINING: "Treinamento",
  EVENT: "Evento",
};

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const confirm = useConfirm();

  const load = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch<{ categories: CategoryDTO[] }>("/categories");
      setCategories(data.categories);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao carregar categorias");
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

  const openEdit = (category: CategoryDTO) => {
    setEditing(category);
    setModalOpen(true);
  };

  const handleDelete = async (category: CategoryDTO) => {
    if (!(await confirm(`Remover a categoria "${category.namePt}"?`))) return;
    try {
      await apiFetch(`/categories/${category.id}`, { method: "DELETE" });
      await load();
      toast.success("Categoria removida.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao remover categoria");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-ink-950">Categorias</h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nova categoria
        </Button>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-surface-border text-ink-500">
            <tr>
              <th className="px-4 py-3 font-medium">Nome (PT)</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Ordem</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-ink-500">
                  Carregando...
                </td>
              </tr>
            )}
            {!isLoading && categories.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-ink-500">
                  Nenhuma categoria cadastrada.
                </td>
              </tr>
            )}
            {categories.map((category) => (
              <tr key={category.id} className="border-b border-surface-border/60">
                <td className="px-4 py-3 text-ink-950">{category.namePt}</td>
                <td className="px-4 py-3 text-ink-600">{CONTENT_TYPE_LABELS[category.contentType]}</td>
                <td className="px-4 py-3 text-ink-600">{category.order}</td>
                <td className="px-4 py-3">
                  <Badge tone={category.status === "ACTIVE" ? "success" : "neutral"}>
                    {category.status === "ACTIVE" ? "Ativa" : "Inativa"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => openEdit(category)} className="mr-2 rounded p-1.5 text-ink-600 hover:bg-surface-border hover:text-ink-950">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(category)} className="rounded p-1.5 text-ink-600 hover:bg-red-100 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <CategoryFormModal
        open={modalOpen}
        category={editing}
        onClose={() => setModalOpen(false)}
        onSaved={async () => {
          setModalOpen(false);
          await load();
        }}
      />
    </div>
  );
}

function CategoryFormModal({
  open,
  category,
  onClose,
  onSaved,
}: {
  open: boolean;
  category: CategoryDTO | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryInput>({ resolver: zodResolver(categoryInputSchema) });
  const toast = useToast();

  useEffect(() => {
    reset(
      category
        ? {
            namePt: category.namePt,
            nameEn: category.nameEn,
            nameEs: category.nameEs,
            description: category.description ?? "",
            contentType: category.contentType,
            order: category.order,
            status: category.status,
          }
        : { contentType: "VIDEO", status: "ACTIVE", order: 0 }
    );
  }, [category, reset, open]);

  const onSubmit = async (data: CategoryInput) => {
    try {
      if (category) {
        await apiFetch(`/categories/${category.id}`, { method: "PATCH", body: data });
      } else {
        await apiFetch("/categories", { method: "POST", body: data });
      }
      onSaved();
      toast.success("Categoria salva com sucesso.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao salvar categoria");
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={category ? "Editar categoria" : "Nova categoria"}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input label="Nome (Português)" error={errors.namePt?.message} {...register("namePt")} />
        <Input label="Nome (English)" error={errors.nameEn?.message} {...register("nameEn")} />
        <Input label="Nome (Español)" error={errors.nameEs?.message} {...register("nameEs")} />
        <Textarea label="Descrição" rows={2} {...register("description")} />
        <Select label="Tipo de conteúdo" {...register("contentType")}>
          {CONTENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {CONTENT_TYPE_LABELS[type]}
            </option>
          ))}
        </Select>
        <Input label="Ordem" type="number" {...register("order", { valueAsNumber: true })} />
        <Select label="Status" {...register("status")}>
          <option value="ACTIVE">Ativa</option>
          <option value="INACTIVE">Inativa</option>
        </Select>
        <Button type="submit" isLoading={isSubmitting} className="self-end">
          Salvar
        </Button>
      </form>
    </Modal>
  );
}
