import type { CategoryDTO, Locale } from "@vmf/shared";

export function categoryName(category: CategoryDTO, locale: string): string {
  switch (locale as Locale) {
    case "en-US":
      return category.nameEn;
    case "es-ES":
      return category.nameEs;
    default:
      return category.namePt;
  }
}
