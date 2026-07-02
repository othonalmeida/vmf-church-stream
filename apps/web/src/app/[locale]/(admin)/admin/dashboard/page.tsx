"use client";

import { useEffect, useState } from "react";
import { Users, Clapperboard, GraduationCap, CalendarDays, Download, TrendingUp } from "lucide-react";
import type { DashboardStatsDTO } from "@vmf/shared";
import { apiFetch, ApiError } from "@/lib/api-client";
import { Card } from "@/components/ui/card";

const STAT_CARDS: { key: keyof DashboardStatsDTO; label: string; icon: typeof Users }[] = [
  { key: "totalMembers", label: "Membros cadastrados", icon: Users },
  { key: "publishedVideos", label: "Vídeos publicados", icon: Clapperboard },
  { key: "activeTrainings", label: "Treinamentos ativos", icon: GraduationCap },
  { key: "upcomingEvents", label: "Eventos futuros", icon: CalendarDays },
  { key: "totalDownloads", label: "Downloads realizados", icon: Download },
  { key: "averageTrainingProgress", label: "Progresso médio (%)", icon: TrendingUp },
];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStatsDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ stats: DashboardStatsDTO }>("/dashboard/stats")
      .then((data) => setStats(data.stats))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Erro ao carregar indicadores"));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
      {error && <p className="rounded-lg bg-red-900/30 px-4 py-2 text-sm text-red-300">{error}</p>}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {STAT_CARDS.map(({ key, label, icon: Icon }) => (
          <Card key={key} className="flex flex-col gap-2">
            <Icon className="h-5 w-5 text-brand-400" />
            <span className="text-2xl font-semibold text-white">{stats ? (stats[key] as number) : "—"}</span>
            <span className="text-xs text-white/50">{label}</span>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-medium text-white">Vídeos mais assistidos</h2>
          <ul className="flex flex-col gap-2">
            {stats?.mostWatchedVideos.map((v) => (
              <li key={v.videoId} className="flex justify-between text-sm text-white/70">
                <span>{v.title}</span>
                <span className="text-white/40">{v.views} visualizações</span>
              </li>
            ))}
            {stats && stats.mostWatchedVideos.length === 0 && <li className="text-sm text-white/50">Sem dados ainda.</li>}
          </ul>
        </Card>
        <Card>
          <h2 className="mb-3 font-medium text-white">Usuários mais ativos</h2>
          <ul className="flex flex-col gap-2">
            {stats?.mostActiveUsers.map((u) => (
              <li key={u.userId} className="flex justify-between text-sm text-white/70">
                <span>{u.name}</span>
                <span className="text-white/40">{u.viewCount} visualizações</span>
              </li>
            ))}
            {stats && stats.mostActiveUsers.length === 0 && <li className="text-sm text-white/50">Sem dados ainda.</li>}
          </ul>
        </Card>
      </div>
    </div>
  );
}
