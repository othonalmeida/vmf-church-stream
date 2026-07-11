"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import type { TrainingDTO, VideoDTO, TextContentDTO } from "@vmf/shared";
import { apiFetch, ApiError } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "@/i18n/routing";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/contexts/toast-context";
import { useConfirm } from "@/contexts/confirm-context";

export default function AdminTrainingDetailPage() {
  const params = useParams<{ id: string }>();
  const [training, setTraining] = useState<TrainingDTO | null>(null);
  const [videos, setVideos] = useState<VideoDTO[]>([]);
  const [texts, setTexts] = useState<TextContentDTO[]>([]);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const confirm = useConfirm();

  const load = async () => {
    try {
      const [t, v, tx] = await Promise.all([
        apiFetch<{ training: TrainingDTO }>(`/trainings/${params.id}`),
        apiFetch<{ items: VideoDTO[] }>("/videos?pageSize=100"),
        apiFetch<{ items: TextContentDTO[] }>("/text-contents?pageSize=100"),
      ]);
      setTraining(t.training);
      setVideos(v.items);
      setTexts(tx.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao carregar treinamento");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const addModule = async (title: string) => {
    await apiFetch(`/trainings/${params.id}/modules`, { method: "POST", body: { title, order: training?.modules.length ?? 0 } });
    await load();
  };

  const deleteModule = async (moduleId: string) => {
    if (!(await confirm("Remover este módulo e todas as suas aulas?"))) return;
    await apiFetch(`/trainings/modules/${moduleId}`, { method: "DELETE" });
    await load();
    toast.success("Módulo removido.");
  };

  const deleteLesson = async (lessonId: string) => {
    await apiFetch(`/trainings/lessons/${lessonId}`, { method: "DELETE" });
    await load();
  };

  if (error) return <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>;
  if (!training) return <p className="text-ink-600">Carregando...</p>;

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/trainings" className="flex items-center gap-1 text-sm text-ink-600 hover:text-ink-950">
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Link>

      <h1 className="text-2xl font-semibold text-ink-950">{training.titlePt}</h1>

      {training.modules.map((module) => (
        <Card key={module.id}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-medium text-ink-950">{module.title}</h2>
            <button onClick={() => deleteModule(module.id)} className="rounded p-1.5 text-ink-600 hover:bg-red-100 hover:text-red-700">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <ul className="mb-3 flex flex-col gap-2">
            {module.lessons.map((lesson) => (
              <li key={lesson.id} className="flex items-center justify-between rounded-lg bg-surface-border/40 px-3 py-2 text-sm text-ink-950">
                <span>
                  [{lesson.contentType === "VIDEO" ? "Vídeo" : "Texto"}] {lesson.title}
                </span>
                <button onClick={() => deleteLesson(lesson.id)} className="text-red-600 hover:underline">
                  Remover
                </button>
              </li>
            ))}
            {module.lessons.length === 0 && <li className="text-sm text-ink-500">Nenhuma aula neste módulo.</li>}
          </ul>

          <AddLessonForm moduleId={module.id} videos={videos} texts={texts} onAdded={load} />
        </Card>
      ))}

      <Card>
        <AddModuleForm onAdd={addModule} />
      </Card>
    </div>
  );
}

function AddModuleForm({ onAdd }: { onAdd: (title: string) => Promise<void> }) {
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    if (!title.trim()) return;
    setIsSubmitting(true);
    try {
      await onAdd(title.trim());
      setTitle("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-end gap-2">
      <Input label="Novo módulo" value={title} onChange={(e) => setTitle(e.target.value)} className="flex-1" />
      <Button onClick={submit} isLoading={isSubmitting}>
        <Plus className="h-4 w-4" />
        Adicionar
      </Button>
    </div>
  );
}

function AddLessonForm({
  moduleId,
  videos,
  texts,
  onAdded,
}: {
  moduleId: string;
  videos: VideoDTO[];
  texts: TextContentDTO[];
  onAdded: () => Promise<void>;
}) {
  const [contentType, setContentType] = useState<"VIDEO" | "TEXT">("VIDEO");
  const [refId, setRefId] = useState("");
  const [title, setTitle] = useState("");
  const [required, setRequired] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  const submit = async () => {
    if (!title.trim() || !refId) return;
    setIsSubmitting(true);
    try {
      await apiFetch(`/trainings/modules/${moduleId}/lessons`, {
        method: "POST",
        body: {
          contentType,
          videoId: contentType === "VIDEO" ? refId : undefined,
          textContentId: contentType === "TEXT" ? refId : undefined,
          title: title.trim(),
          required,
          order: 0,
        },
      });
      setTitle("");
      setRefId("");
      await onAdded();
      toast.success("Aula adicionada.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao adicionar aula");
    } finally {
      setIsSubmitting(false);
    }
  };

  const options = contentType === "VIDEO" ? videos : texts;

  return (
    <div className="grid grid-cols-1 gap-2 border-t border-surface-border pt-3 sm:grid-cols-4">
      <Select value={contentType} onChange={(e) => { setContentType(e.target.value as "VIDEO" | "TEXT"); setRefId(""); }}>
        <option value="VIDEO">Vídeo</option>
        <option value="TEXT">Texto</option>
      </Select>
      <Select value={refId} onChange={(e) => setRefId(e.target.value)}>
        <option value="">Selecione...</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.titlePt}
          </option>
        ))}
      </Select>
      <Input placeholder="Título da aula" value={title} onChange={(e) => setTitle(e.target.value)} />
      <div className="flex items-center gap-2">
        <Checkbox label="Obrigatória" checked={required} onChange={(e) => setRequired(e.target.checked)} />
        <Button onClick={submit} isLoading={isSubmitting} className="ml-auto">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
