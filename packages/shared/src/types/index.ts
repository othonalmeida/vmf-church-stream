import type {
  RoleName,
  ContentTypeName,
  PublishStatusName,
  TranscodeStatusName,
  DownloadStatusName,
  Locale,
  SubtitleLanguage,
} from "../constants/index";

export type {
  RoleName,
  ContentTypeName,
  PublishStatusName,
  TranscodeStatusName,
  DownloadStatusName,
  Locale,
  SubtitleLanguage,
};

export interface UserDTO {
  id: string;
  name: string;
  email: string;
  role: RoleName;
  status: "ACTIVE" | "INACTIVE";
  preferredLocale: Locale;
  createdAt: string;
}

export interface CategoryDTO {
  id: string;
  namePt: string;
  nameEn: string;
  nameEs: string;
  description: string | null;
  contentType: ContentTypeName;
  order: number;
  status: "ACTIVE" | "INACTIVE";
}

export interface SubtitleDTO {
  id: string;
  videoId: string;
  language: SubtitleLanguage;
  fileUrl: string;
  status: "ACTIVE" | "INACTIVE";
}

export interface VideoDTO {
  id: string;
  title: string;
  description: string | null;
  categoryId: string;
  thumbnailUrl: string | null;
  hlsPlaylistUrl: string | null;
  duration: number | null;
  originalLanguage: Locale;
  allowDownload: boolean;
  status: PublishStatusName;
  featured: boolean;
  order: number;
  publishedAt: string | null;
  transcodeStatus: TranscodeStatusName;
  subtitles: SubtitleDTO[];
  createdAt: string;
}

export interface TextContentDTO {
  id: string;
  title: string;
  description: string | null;
  contentHtml: string;
  categoryId: string;
  language: Locale;
  imageUrl: string | null;
  status: PublishStatusName;
  featured: boolean;
  publishedAt: string | null;
}

export interface TrainingLessonDTO {
  id: string;
  moduleId: string;
  contentType: "VIDEO" | "TEXT";
  videoId: string | null;
  textContentId: string | null;
  title: string;
  description: string | null;
  order: number;
  required: boolean;
  completed?: boolean;
}

export interface TrainingModuleDTO {
  id: string;
  trainingId: string;
  title: string;
  description: string | null;
  order: number;
  lessons: TrainingLessonDTO[];
}

export interface TrainingDTO {
  id: string;
  title: string;
  description: string | null;
  categoryId: string;
  imageUrl: string | null;
  status: PublishStatusName;
  featured: boolean;
  order: number;
  modules: TrainingModuleDTO[];
  progressPercent?: number;
}

export interface EventDTO {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  location: string | null;
  imageUrl: string | null;
  categoryId: string | null;
  language: Locale;
  status: PublishStatusName;
}

export interface DashboardStatsDTO {
  totalMembers: number;
  publishedVideos: number;
  activeTrainings: number;
  upcomingEvents: number;
  totalDownloads: number;
  averageTrainingProgress: number;
  mostWatchedVideos: { videoId: string; title: string; views: number }[];
  mostActiveUsers: { userId: string; name: string; viewCount: number }[];
}
