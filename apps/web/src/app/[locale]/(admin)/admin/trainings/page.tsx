"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Settings, Trash2 } from "lucide-react";
import { trainingInputSchema, type TrainingInput, type TrainingDTO, type CategoryDTO } from "@vmf/shared";
import { apiFetch, ApiError } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/routing";

export default function AdminTrainingsPage() {
  const [trainings, setTrainings] = useState<TrainingDTO[]>([]);
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const [t, c] = await Promise.all([
        apiFetch<{ trainings: TrainingDTO[] }>("/trainings"),
        apiFetch<{ categories: CategoryDTO[] }>("/categories?contentType=TRAINING"),
      ]);
      setTrainings(t.trainings);
      setCategories(c.categories);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao carregar treinamentos");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (training: TrainingDTO) => {
    if (!confirm(`Remover "${training.title}"?`)) return;
    try {
      await apiFetch(`/trainings/${training.id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Erro ao remover treinamento");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Treinamentos</h1>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Novo treinamento
        </Button>
      </div>

      {error && <p className="rounded-lg bg-red-900/30 px-4 py-2 text-sm text-red-300">{error}</p>}
      {!error && categories.length === 0 && (
        <p className="rounded-lg bg-amber-900/20 px-4 py-2 text-sm text-amber-300">
          Cadastre uma categoria do tipo "Treinamento" antes de criar treinamentos.
        </p>
      )}

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-surface-border text-white/50">
            <tr>
              <th className="px-4 py-3 font-medium">Título</th>
              <th className="px-4 py-3 font-medium">Módulos</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {trainings.map((training) => (
              <tr key={training.id} className="border-b border-surface-border/60">
                <td className="px-4 py-3 text-white">{training.title}</td>
                <td className="px-4 py-3 text-white/70">{training.modules.length}</td>
                <td className="px-4 py-3">
                  <Badge tone={training.status === "PUBLISHED" ? "success" : "neutral"}>{training.status}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/trainings/${training.id}`}
                    className="mr-2 inline-flex rounded p-1.5 text-white/60 hover:bg-surface-border hover:text-white"
                  >
                    <Settings className="h-4 w-4" />
                  </Link>
                  <button onClick={() => handleDelete(training)} className="rounded p-1.5 text-white/60 hover:bg-red-500/20 hover:text-red-300">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <CreateTrainingModal
        open={modalOpen}
        categories={categories}
        onClose={() => setModalOpen(false)}
        onSaved={async () => {
          setModalOpen(false);
          await load();
        }}
      />
    </div>
  );
}

function CreateTrainingModal({
  open,
  categories,
  onClose,
  onSaved,
}: {
  open: boolean;
  categories: CategoryDTO[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TrainingInput>({
    resolver: zodResolver(trainingInputSchema),
    defaultValues: { status: "DRAFT", order: 0, categoryId: categories[0]?.id },
  });

  useEffect(() => {
    reset({ status: "DRAFT", order: 0, categoryId: categories[0]?.id });
  }, [categories, reset, open]);

  const onSubmit = async (data: TrainingInput) => {
    try {
      await apiFetch("/trainings", { method: "POST", body: data });
      onSaved();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Erro ao criar treinamento");
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Novo treinamento">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input label="Título" error={errors.title?.message} {...register("title")} />
        <Textarea label="Descrição" rows={3} {...register("description")} />
        <Select label="Categoria" error={errors.categoryId?.message} {...register("categoryId")}>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.namePt}
            </option>
          ))}
        </Select>
        <Input label="URL da imagem" {...register("imageUrl")} />
        <Select label="Status" {...register("status")}>
          <option value="DRAFT">Rascunho</option>
          <option value="PUBLISHED">Publicado</option>
        </Select>
        <Checkbox label="Destaque na home" {...register("featured")} />
        <Button type="submit" isLoading={isSubmitting} className="self-end">
          Criar
        </Button>
      </form>
    </Modal>
  );
}
