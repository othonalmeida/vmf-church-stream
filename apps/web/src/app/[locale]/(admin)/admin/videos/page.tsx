"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2, Upload, Captions, RotateCw } from "lucide-react";
import {
  videoInputSchema,
  type VideoInput,
  type VideoDTO,
  type CategoryDTO,
  SUPPORTED_LOCALES,
  SUBTITLE_LANGUAGES,
} from "@vmf/shared";
import { apiFetch, ApiError } from "@/lib/api-client";
import { uploadWithProgress } from "@/lib/upload";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";

interface PaginatedVideos {
  items: VideoDTO[];
}

const TRANSCODE_TONE: Record<VideoDTO["transcodeStatus"], "success" | "warning" | "danger" | "neutral"> = {
  READY: "success",
  PENDING: "neutral",
  PROCESSING: "warning",
  FAILED: "danger",
};

export default function AdminVideosPage() {
  const [videos, setVideos] = useState<VideoDTO[]>([]);
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metaModalVideo, setMetaModalVideo] = useState<VideoDTO | null | "new">(null);
  const [uploadModalVideo, setUploadModalVideo] = useState<VideoDTO | null>(null);
  const [subtitlesModalVideo, setSubtitlesModalVideo] = useState<VideoDTO | null>(null);

  const load = useCallback(async () => {
    try {
      const [vids, cats] = await Promise.all([
        apiFetch<PaginatedVideos>("/videos?pageSize=100"),
        apiFetch<{ categories: CategoryDTO[] }>("/categories?contentType=VIDEO"),
      ]);
      setVideos(vids.items);
      setCategories(cats.categories);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao carregar vídeos");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const hasPending = videos.some((v) => v.transcodeStatus === "PENDING" || v.transcodeStatus === "PROCESSING");
    if (!hasPending) return;
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [videos, load]);

  const categoryName = (id: string) => categories.find((c) => c.id === id)?.namePt ?? "-";

  const handleDelete = async (video: VideoDTO) => {
    if (!confirm(`Remover "${video.title}"?`)) return;
    try {
      await apiFetch(`/videos/${video.id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Erro ao remover vídeo");
    }
  };

  const handleReprocess = async (video: VideoDTO) => {
    try {
      await apiFetch(`/videos/${video.id}/reprocess`, { method: "POST" });
      await load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Erro ao reprocessar vídeo");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-ink-950">Vídeos</h1>
        <Button onClick={() => setMetaModalVideo("new")}>
          <Plus className="h-4 w-4" />
          Novo vídeo
        </Button>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
      {!isLoading && categories.length === 0 && (
        <p className="rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-700">
          Cadastre uma categoria do tipo "Vídeo" antes de criar vídeos.
        </p>
      )}

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-surface-border text-ink-500">
            <tr>
              <th className="px-4 py-3 font-medium">Título</th>
              <th className="px-4 py-3 font-medium">Categoria</th>
              <th className="px-4 py-3 font-medium">Publicação</th>
              <th className="px-4 py-3 font-medium">Transcodificação</th>
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
            {videos.map((video) => (
              <tr key={video.id} className="border-b border-surface-border/60">
                <td className="px-4 py-3 text-ink-950">{video.title}</td>
                <td className="px-4 py-3 text-ink-600">{categoryName(video.categoryId)}</td>
                <td className="px-4 py-3">
                  <Badge tone={video.status === "PUBLISHED" ? "success" : "neutral"}>{video.status}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={TRANSCODE_TONE[video.transcodeStatus]}>{video.transcodeStatus}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setUploadModalVideo(video)} title="Enviar arquivo de vídeo" className="mr-2 rounded p-1.5 text-ink-600 hover:bg-surface-border hover:text-ink-950">
                    <Upload className="h-4 w-4" />
                  </button>
                  <button onClick={() => setSubtitlesModalVideo(video)} title="Gerenciar legendas" className="mr-2 rounded p-1.5 text-ink-600 hover:bg-surface-border hover:text-ink-950">
                    <Captions className="h-4 w-4" />
                  </button>
                  {video.transcodeStatus === "FAILED" && (
                    <button onClick={() => handleReprocess(video)} title="Reprocessar" className="mr-2 rounded p-1.5 text-ink-600 hover:bg-surface-border hover:text-ink-950">
                      <RotateCw className="h-4 w-4" />
                    </button>
                  )}
                  <button onClick={() => setMetaModalVideo(video)} title="Editar" className="mr-2 rounded p-1.5 text-ink-600 hover:bg-surface-border hover:text-ink-950">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(video)} title="Excluir" className="rounded p-1.5 text-ink-600 hover:bg-red-100 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <VideoFormModal
        open={metaModalVideo !== null}
        video={metaModalVideo === "new" ? null : metaModalVideo}
        categories={categories}
        onClose={() => setMetaModalVideo(null)}
        onSaved={async () => {
          setMetaModalVideo(null);
          await load();
        }}
      />

      <UploadModal
        open={uploadModalVideo !== null}
        video={uploadModalVideo}
        onClose={() => setUploadModalVideo(null)}
        onUploaded={async () => {
          setUploadModalVideo(null);
          await load();
        }}
      />

      <SubtitlesModal
        open={subtitlesModalVideo !== null}
        video={subtitlesModalVideo}
        onClose={() => setSubtitlesModalVideo(null)}
        onChanged={load}
      />
    </div>
  );
}

function VideoFormModal({
  open,
  video,
  categories,
  onClose,
  onSaved,
}: {
  open: boolean;
  video: VideoDTO | null;
  categories: CategoryDTO[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VideoInput>({ resolver: zodResolver(videoInputSchema) });

  useEffect(() => {
    reset(
      video
        ? {
            title: video.title,
            description: video.description ?? "",
            categoryId: video.categoryId,
            originalLanguage: video.originalLanguage,
            allowDownload: video.allowDownload,
            status: video.status,
            featured: video.featured,
            order: video.order,
          }
        : { originalLanguage: "pt-BR", status: "DRAFT", order: 0, categoryId: categories[0]?.id, allowDownload: false }
    );
  }, [video, reset, open, categories]);

  const onSubmit = async (data: VideoInput) => {
    try {
      if (video) {
        await apiFetch(`/videos/${video.id}`, { method: "PATCH", body: data });
      } else {
        await apiFetch("/videos", { method: "POST", body: data });
      }
      onSaved();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Erro ao salvar vídeo");
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={video ? "Editar vídeo" : "Novo vídeo"}>
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
        <Select label="Idioma original" {...register("originalLanguage")}>
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
        <Input label="Ordem" type="number" {...register("order", { valueAsNumber: true })} />
        <Checkbox label="Destaque na home" {...register("featured")} />
        <Checkbox label="Permitir download offline" {...register("allowDownload")} />
        <Button type="submit" isLoading={isSubmitting} className="self-end">
          Salvar
        </Button>
      </form>
    </Modal>
  );
}

function UploadModal({
  open,
  video,
  onClose,
  onUploaded,
}: {
  open: boolean;
  video: VideoDTO | null;
  onClose: () => void;
  onUploaded: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!video) return;
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("Selecione um arquivo de vídeo antes de enviar.");
      return;
    }

    setError(null);
    setProgress(0);
    try {
      const formData = new FormData();
      formData.append("file", file);
      await uploadWithProgress(`/videos/${video.id}/upload`, formData, setProgress);
      setProgress(null);
      onUploaded();
    } catch (err) {
      setProgress(null);
      setError(err instanceof ApiError ? err.message : "Erro ao enviar vídeo");
    }
  };

  if (!video) return null;

  return (
    <Modal open={open} onClose={onClose} title={`Enviar arquivo: ${video.title}`}>
      <div className="flex flex-col gap-4">
        <input ref={fileInputRef} type="file" accept="video/*" className="text-sm text-ink-600" />
        {error && <p className="text-sm text-red-600">{error}</p>}
        {progress !== null && (
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-border">
            <div className="h-full bg-brand-600 transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}
        <Button onClick={handleUpload} isLoading={progress !== null} className="self-end">
          Enviar
        </Button>
      </div>
    </Modal>
  );
}

function SubtitlesModal({
  open,
  video,
  onClose,
  onChanged,
}: {
  open: boolean;
  video: VideoDTO | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const languageRef = useRef<HTMLSelectElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!video) return;
    const file = fileInputRef.current?.files?.[0];
    const language = languageRef.current?.value;
    if (!file) {
      setError("Selecione um arquivo .vtt ou .srt antes de enviar.");
      return;
    }
    if (!language) {
      setError("Selecione o idioma da legenda.");
      return;
    }

    setError(null);
    setIsUploading(true);
    try {
      const formData = new FormData();
      // "language" precisa vir antes do "file" no FormData: o backend le os
      // campos do multipart na ordem em que chegam no stream.
      formData.append("language", language);
      formData.append("file", file);
      await uploadWithProgress(`/videos/${video.id}/subtitles`, formData);
      if (fileInputRef.current) fileInputRef.current.value = "";
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao enviar legenda");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (subtitleId: string) => {
    if (!video) return;
    try {
      await apiFetch(`/videos/${video.id}/subtitles/${subtitleId}`, { method: "DELETE" });
      onChanged();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Erro ao remover legenda");
    }
  };

  if (!video) return null;

  return (
    <Modal open={open} onClose={onClose} title={`Legendas: ${video.title}`}>
      <div className="flex flex-col gap-4">
        <ul className="flex flex-col gap-2">
          {video.subtitles.length === 0 && <li className="text-sm text-ink-500">Nenhuma legenda enviada.</li>}
          {video.subtitles.map((s) => (
            <li key={s.id} className="flex items-center justify-between rounded-lg bg-surface-border/40 px-3 py-2 text-sm text-ink-950">
              {s.language}
              <button onClick={() => handleDelete(s.id)} className="text-red-600 hover:underline">
                Remover
              </button>
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-2 border-t border-surface-border pt-4">
          <Select label="Idioma" ref={languageRef}>
            {SUBTITLE_LANGUAGES.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </Select>
          <input ref={fileInputRef} type="file" accept=".vtt,.srt" className="text-sm text-ink-600" />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button onClick={handleUpload} isLoading={isUploading} className="self-end">
            Enviar legenda
          </Button>
        </div>
      </div>
    </Modal>
  );
}
