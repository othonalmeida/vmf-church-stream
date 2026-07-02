import { Card } from "./card";

export function ComingSoon({ title, note }: { title: string; note?: string }) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-ink-950">{title}</h1>
      <Card>
        <p className="text-sm text-ink-600">
          {note ?? "Esta área será implementada em uma fase seguinte do projeto (ver docs/ARCHITECTURE.md)."}
        </p>
      </Card>
    </div>
  );
}
