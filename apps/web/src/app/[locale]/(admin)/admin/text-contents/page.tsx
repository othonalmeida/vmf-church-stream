"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  textContentInputSchema,
  type TextContentInput,
  type TextContentDTO,
  type CategoryDTO,
  SUPPORTED_LOCALES,
} from "@vmf/shared";
import { apiFetch, ApiError } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";

interface PaginatedTextContents {
  items: TextContentDTO[];
  total: number;
}

export default function AdminTextContentsPage() {
  const [data, setData] = useState<TextContentDTO[]>([]);
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TextContentDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    try {
      const [contents, cats] = await Promise.all([
        apiFetch<PaginatedTextContents>("/text-contents?pageSize=100"),
        apiFetch<{ categories: CategoryDTO[] }>("/categories?contentType=TEXT"),
      ]);
      setData(contents.items);
      setCategories(cats.categories);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao carregar conteúdos");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (content: TextContentDTO) => {
    if (!confirm(`Remover "${content.title}"?`)) return;
    try {
      await apiFetch(`/text-contents/${content.id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Erro ao remover conteúdo");
    }
  };

  const categoryName = (id: string) => categories.find((c) => c.id === id)?.namePt ?? "-";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-ink-950">Conteúdos</h1>
        <Button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Novo conteúdo
        </Button>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
      {!isLoading && categories.length === 0 && (
        <p className="rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-700">
          Cadastre uma categoria do tipo "Texto" antes de criar conteúdos.
        </p>
      )}

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-surface-border text-ink-500">
            <tr>
              <th className="px-4 py-3 font-medium">Título</th>
              <th className="px-4 py-3 font-medium">Categoria</th>
              <th className="px-4 py-3 font-medium">Idioma</th>
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
            {data.map((content) => (
              <tr key={content.id} className="border-b border-surface-border/60">
                <td className="px-4 py-3 text-ink-950">{content.title}</td>
                <td className="px-4 py-3 text-ink-600">{categoryName(content.categoryId)}</td>
                <td className="px-4 py-3 text-ink-600">{content.language}</td>
                <td className="px-4 py-3">
                  <Badge tone={content.status === "PUBLISHED" ? "success" : "neutral"}>{content.status}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => {
                      setEditing(content);
                      setModalOpen(true);
                    }}
                    className="mr-2 rounded p-1.5 text-ink-600 hover:bg-surface-border hover:text-ink-950"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(content)} className="rounded p-1.5 text-ink-600 hover:bg-red-100 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <TextContentFormModal
        open={modalOpen}
        content={editing}
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

function TextContentFormModal({
  open,
  content,
  categories,
  onClose,
  onSaved,
}: {
  open: boolean;
  content: TextContentDTO | null;
  categories: CategoryDTO[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TextContentInput>({ resolver: zodResolver(textContentInputSchema) });

  useEffect(() => {
    reset(
      content
        ? {
            title: content.title,
            description: content.description ?? "",
            contentHtml: content.contentHtml,
            categoryId: content.categoryId,
            language: content.language,
            imageUrl: content.imageUrl ?? "",
            status: content.status,
            featured: content.featured,
          }
        : { language: "pt-BR", status: "DRAFT", categoryId: categories[0]?.id }
    );
  }, [content, reset, open, categories]);

  const onSubmit = async (data: TextContentInput) => {
    try {
      if (content) {
        await apiFetch(`/text-contents/${content.id}`, { method: "PATCH", body: data });
      } else {
        await apiFetch("/text-contents", { method: "POST", body: data });
      }
      onSaved();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Erro ao salvar conteúdo");
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={content ? "Editar conteúdo" : "Novo conteúdo"}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input label="Título" error={errors.title?.message} {...register("title")} />
        <Textarea label="Descrição curta" rows={2} {...register("description")} />
        <Textarea
          label="Conteúdo (HTML)"
          rows={8}
          error={errors.contentHtml?.message}
          {...register("contentHtml")}
        />
        <Input label="URL da imagem de capa" {...register("imageUrl")} />
        <Select label="Categoria" error={errors.categoryId?.message} {...register("categoryId")}>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.namePt}
            </option>
          ))}
        </Select>
        <Select label="Idioma" {...register("language")}>
          {SUPPORTED_LOCALES.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </Select>
        <Select label="Status" {...register("status")}>
          <option value="DRAFT">Rascunho</option>
          <option value="PUBLISHED">Publicado</option>
          <option value="ARCHIVED">Arquivado</option>
        </Select>
        <Checkbox label="Destaque na home" {...register("featured")} />
        <Button type="submit" isLoading={isSubmitting} className="self-end">
          Salvar
        </Button>
      </form>
    </Modal>
  );
}
