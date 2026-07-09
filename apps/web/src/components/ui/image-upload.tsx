"use client";

import { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { Input } from "./input";
import { uploadWithProgress } from "@/lib/upload";
import { ApiError } from "@/lib/api-client";

interface ImageUploadFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  error?: string;
}

export function ImageUploadField({ label, value, onChange, error }: ImageUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = (await uploadWithProgress("/media/images", formData)) as { url: string };
      onChange(result.url);
    } catch (err) {
      setUploadError(err instanceof ApiError ? err.message : "Erro ao enviar imagem");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <Input
        label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        error={error}
        placeholder="https://... ou envie um arquivo abaixo"
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-1.5 rounded-lg border border-surface-border px-3 py-1.5 text-xs font-medium text-ink-700 transition-colors hover:bg-surface-border disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          {isUploading ? "Enviando..." : "Escolher do dispositivo"}
        </button>
        {value && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-10 w-10 rounded-lg border border-surface-border object-cover" />
        )}
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleFileSelect} />
      </div>
      {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
    </div>
  );
}
