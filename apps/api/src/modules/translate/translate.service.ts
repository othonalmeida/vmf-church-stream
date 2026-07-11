import type { TranslateRequest, TranslateResponse } from "@vmf/shared";

export class TranslateError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 502) {
    super(message);
    this.statusCode = statusCode;
    this.name = "TranslateError";
  }
}

const TARGET_LANGUAGES: { locale: "en-US" | "es-ES"; code: string }[] = [
  { locale: "en-US", code: "en" },
  { locale: "es-ES", code: "es" },
];

async function translateBatch(texts: string[], target: string, html: boolean): Promise<string[]> {
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!apiKey) {
    throw new TranslateError("GOOGLE_TRANSLATE_API_KEY is not configured", 500);
  }

  const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      q: texts,
      source: "pt",
      target,
      format: html ? "html" : "text",
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new TranslateError(`Google Translate request failed: ${body}`);
  }

  const data = (await response.json()) as {
    data: { translations: { translatedText: string }[] };
  };
  return data.data.translations.map((t) => t.translatedText);
}

export async function translateFields(input: TranslateRequest): Promise<TranslateResponse> {
  const fieldNames = Object.keys(input);
  const textFieldNames = fieldNames.filter((name) => !input[name].html);
  const htmlFieldNames = fieldNames.filter((name) => input[name].html);

  const result: TranslateResponse = { "en-US": {}, "es-ES": {} };

  for (const target of TARGET_LANGUAGES) {
    if (textFieldNames.length) {
      const translated = await translateBatch(
        textFieldNames.map((name) => input[name].text),
        target.code,
        false
      );
      textFieldNames.forEach((name, i) => {
        result[target.locale][name] = translated[i];
      });
    }
    if (htmlFieldNames.length) {
      const translated = await translateBatch(
        htmlFieldNames.map((name) => input[name].text),
        target.code,
        true
      );
      htmlFieldNames.forEach((name, i) => {
        result[target.locale][name] = translated[i];
      });
    }
  }

  return result;
}
