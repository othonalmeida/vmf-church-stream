"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { bannerInputSchema, type BannerInput, type BannerDTO } from "@vmf/shared";
import { apiFetch, ApiError } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<BannerDTO[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BannerDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const data = await apiFetch<{ banners: BannerDTO[] }>("/banners");
      setBanners(data.banners);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao carregar banners");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (banner: BannerDTO) => {
    if (!confirm(`Remover banner "${banner.title}"?`)) return;
    try {
      await apiFetch(`/banners/${banner.id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Erro ao remover banner");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Banners</h1>
        <Button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Novo banner
        </Button>
      </div>

      {error && <p className="rounded-lg bg-red-900/30 px-4 py-2 text-sm text-red-300">{error}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {banners.map((banner) => (
          <Card key={banner.id} className="flex flex-col gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={banner.imageUrl} alt={banner.title} className="h-32 w-full rounded-lg object-cover" />
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-white">{banner.title}</h3>
              <Badge tone={banner.status === "ACTIVE" ? "success" : "neutral"}>
                {banner.status === "ACTIVE" ? "Ativo" : "Inativo"}
              </Badge>
            </div>
            <div className="mt-auto flex gap-2">
              <button
                onClick={() => {
                  setEditing(banner);
                  setModalOpen(true);
                }}
                className="rounded p-1.5 text-white/60 hover:bg-surface-border hover:text-white"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button onClick={() => handleDelete(banner)} className="rounded p-1.5 text-white/60 hover:bg-red-500/20 hover:text-red-300">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </Card>
        ))}
        {banners.length === 0 && <p className="text-white/60">Nenhum banner cadastrado.</p>}
      </div>

      <BannerFormModal
        open={modalOpen}
        banner={editing}
        onClose={() => setModalOpen(false)}
        onSaved={async () => {
          setModalOpen(false);
          await load();
        }}
      />
    </div>
  );
}

function BannerFormModal({
  open,
  banner,
  onClose,
  onSaved,
}: {
  open: boolean;
  banner: BannerDTO | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BannerInput>({ resolver: zodResolver(bannerInputSchema) });

  useEffect(() => {
    reset(
      banner
        ? {
            title: banner.title,
            subtitle: banner.subtitle ?? "",
            imageUrl: banner.imageUrl,
            linkUrl: banner.linkUrl ?? "",
            order: banner.order,
            status: banner.status,
          }
        : { status: "ACTIVE", order: 0 }
    );
  }, [banner, reset, open]);

  const onSubmit = async (data: BannerInput) => {
    try {
      if (banner) {
        await apiFetch(`/banners/${banner.id}`, { method: "PATCH", body: data });
      } else {
        await apiFetch("/banners", { method: "POST", body: data });
      }
      onSaved();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Erro ao salvar banner");
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={banner ? "Editar banner" : "Novo banner"}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input label="Título" error={errors.title?.message} {...register("title")} />
        <Input label="Subtítulo" {...register("subtitle")} />
        <Input label="URL da imagem" error={errors.imageUrl?.message} {...register("imageUrl")} />
        <Input label="Link (opcional)" {...register("linkUrl")} />
        <Input label="Ordem" type="number" {...register("order", { valueAsNumber: true })} />
        <Select label="Status" {...register("status")}>
          <option value="ACTIVE">Ativo</option>
          <option value="INACTIVE">Inativo</option>
        </Select>
        <Button type="submit" isLoading={isSubmitting} className="self-end">
          Salvar
        </Button>
      </form>
    </Modal>
  );
}
