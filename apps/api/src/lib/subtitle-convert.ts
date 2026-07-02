import { parseSync, stringifySync } from "subtitle";

export function srtToVtt(srtContent: string): string {
  const nodes = parseSync(srtContent);
  return stringifySync(nodes, { format: "WebVTT" });
}

export function isLikelyVtt(content: string): boolean {
  return content.trimStart().startsWith("WEBVTT");
}
