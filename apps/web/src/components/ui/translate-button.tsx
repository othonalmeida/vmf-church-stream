"use client";

import { useState } from "react";
import { Languages } from "lucide-react";
import type { TranslateRequest, TranslateResponse } from "@vmf/shared";
import { apiFetch, ApiError } from "@/lib/api-client";
import { Button } from "./button";
import { useToast } from "@/contexts/toast-context";

export function TranslateButton({
  getFields,
  onTranslated,
}: {
  getFields: () => TranslateRequest;
  onTranslated: (result: TranslateResponse) => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const handleClick = async () => {
    setIsLoading(true);
    try {
      const result = await apiFetch<TranslateResponse>("/translate", { method: "POST", body: getFields() });
      onTranslated(result);
      toast.success("Traduzido automaticamente. Revise antes de salvar.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao traduzir");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button type="button" variant="secondary" onClick={handleClick} isLoading={isLoading} className="self-start">
      <Languages className="h-4 w-4" />
      Traduzir automaticamente (PT → EN/ES)
    </Button>
  );
}
