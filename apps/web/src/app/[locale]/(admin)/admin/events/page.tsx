"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { eventInputSchema, type EventInput, type EventDTO, type CategoryDTO } from "@vmf/shared";
import { apiFetch, ApiError } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { ImageUploadField } from "@/components/ui/image-upload";
import { TranslateButton } from "@/components/ui/translate-button";
import { useToast } from "@/contexts/toast-context";
import { useConfirm } from "@/contexts/confirm-context";

function toLocalInputValue(iso?: string) {
  if (!iso) return "";
  const date = new Date(iso);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<EventDTO[]>([]);
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EventDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const confirm = useConfirm();

  const load = async () => {
    try {
      const [e, c] = await Promise.all([
        apiFetch<{ events: EventDTO[] }>("/events"),
        apiFetch<{ categories: CategoryDTO[] }>("/categories?contentType=EVENT"),
      ]);
      setEvents(e.events);
      setCategories(c.categories);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao carregar eventos");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (event: EventDTO) => {
    if (!(await confirm(`Remover "${event.titlePt}"?`))) return;
    try {
      await apiFetch(`/events/${event.id}`, { method: "DELETE" });
      await load();
      toast.success("Evento removido.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao remover evento");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-ink-950">Eventos</h1>
        <Button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Novo evento
        </Button>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-surface-border text-ink-500">
            <tr>
              <th className="px-4 py-3 font-medium">Título</th>
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id} className="border-b border-surface-border/60">
                <td className="px-4 py-3 text-ink-950">{event.titlePt}</td>
                <td className="px-4 py-3 text-ink-600">{new Date(event.startDate).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <Badge tone={event.status === "PUBLISHED" ? "success" : "neutral"}>{event.status}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => {
                      setEditing(event);
                      setModalOpen(true);
                    }}
                    className="mr-2 rounded p-1.5 text-ink-600 hover:bg-surface-border hover:text-ink-950"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(event)} className="rounded p-1.5 text-ink-600 hover:bg-red-100 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <EventFormModal
        open={modalOpen}
        event={editing}
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

function EventFormModal({
  open,
  event,
  categories,
  onClose,
  onSaved,
}: {
  open: boolean;
  event: EventDTO | null;
  categories: CategoryDTO[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EventInput>({ resolver: zodResolver(eventInputSchema) });
  const toast = useToast();

  useEffect(() => {
    reset(
      event
        ? {
            titlePt: event.titlePt,
            titleEn: event.titleEn,
            titleEs: event.titleEs,
            descriptionPt: event.descriptionPt ?? "",
            descriptionEn: event.descriptionEn ?? "",
            descriptionEs: event.descriptionEs ?? "",
            startDate: new Date(toLocalInputValue(event.startDate)) as unknown as Date,
            endDate: event.endDate ? (new Date(toLocalInputValue(event.endDate)) as unknown as Date) : undefined,
            location: event.location ?? "",
            imageUrl: event.imageUrl ?? "",
            categoryId: event.categoryId ?? undefined,
            status: event.status,
          }
        : { status: "DRAFT" }
    );
  }, [event, reset, open]);

  const onSubmit = async (data: EventInput) => {
    try {
      if (event) {
        await apiFetch(`/events/${event.id}`, { method: "PATCH", body: data });
      } else {
        await apiFetch("/events", { method: "POST", body: data });
      }
      onSaved();
      toast.success("Evento salvo com sucesso.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao salvar evento");
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={event ? "Editar evento" : "Novo evento"}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input label="Título (PT)" error={errors.titlePt?.message} {...register("titlePt")} />
        <Textarea label="Descrição (PT)" rows={3} {...register("descriptionPt")} />

        <TranslateButton
          getFields={() => ({
            titlePt: { text: watch("titlePt") || "" },
            descriptionPt: { text: watch("descriptionPt") || "" },
          })}
          onTranslated={(result) => {
            setValue("titleEn", result["en-US"].titlePt);
            setValue("titleEs", result["es-ES"].titlePt);
            setValue("descriptionEn", result["en-US"].descriptionPt);
            setValue("descriptionEs", result["es-ES"].descriptionPt);
          }}
        />

        <Input label="Título (EN)" error={errors.titleEn?.message} {...register("titleEn")} />
        <Textarea label="Descrição (EN)" rows={3} {...register("descriptionEn")} />
        <Input label="Título (ES)" error={errors.titleEs?.message} {...register("titleEs")} />
        <Textarea label="Descrição (ES)" rows={3} {...register("descriptionEs")} />

        <Input
          label="Início"
          type="datetime-local"
          defaultValue={event ? toLocalInputValue(event.startDate) : ""}
          error={errors.startDate?.message}
          {...register("startDate")}
        />
        <Input
          label="Término (opcional)"
          type="datetime-local"
          defaultValue={event?.endDate ? toLocalInputValue(event.endDate) : ""}
          {...register("endDate")}
        />
        <Input label="Local" {...register("location")} />
        <ImageUploadField
          label="Imagem"
          value={watch("imageUrl") ?? ""}
          onChange={(url) => setValue("imageUrl", url, { shouldDirty: true })}
          error={errors.imageUrl?.message}
        />
        <Select label="Categoria" {...register("categoryId")}>
          <option value="">Nenhuma</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.namePt}
            </option>
          ))}
        </Select>
        <Select label="Status" {...register("status")}>
          <option value="DRAFT">Rascunho</option>
          <option value="PUBLISHED">Publicado</option>
        </Select>
        <Button type="submit" isLoading={isSubmitting} className="self-end">
          Salvar
        </Button>
      </form>
    </Modal>
  );
}
