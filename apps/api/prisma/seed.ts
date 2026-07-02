import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@igreja.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "TrocarSenha123!";
  const memberEmail = process.env.SEED_MEMBER_EMAIL || "membro@igreja.local";
  const memberPassword = process.env.SEED_MEMBER_PASSWORD || "TrocarSenha123!";

  const adminPasswordHash = await bcrypt.hash(adminPassword, 12);
  const memberPasswordHash = await bcrypt.hash(memberPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: "Administrador",
      email: adminEmail,
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      status: "ACTIVE",
      preferredLocale: "pt_BR",
    },
  });

  await prisma.user.upsert({
    where: { email: memberEmail },
    update: {},
    create: {
      name: "Membro de Exemplo",
      email: memberEmail,
      passwordHash: memberPasswordHash,
      role: "MEMBER",
      status: "ACTIVE",
      preferredLocale: "pt_BR",
    },
  });

  const categoryDefs = [
    { namePt: "Cultos", nameEn: "Services", nameEs: "Cultos", contentType: "VIDEO" as const, order: 0 },
    { namePt: "Louvor", nameEn: "Worship", nameEs: "Alabanza", contentType: "VIDEO" as const, order: 1 },
    { namePt: "Estudos Bíblicos", nameEn: "Bible Studies", nameEs: "Estudios Bíblicos", contentType: "VIDEO" as const, order: 2 },
    { namePt: "Discipulado", nameEn: "Discipleship", nameEs: "Discipulado", contentType: "TRAINING" as const, order: 0 },
    { namePt: "Escola de Ministérios", nameEn: "Ministry School", nameEs: "Escuela de Ministerios", contentType: "TRAINING" as const, order: 1 },
    { namePt: "Liderança", nameEn: "Leadership", nameEs: "Liderazgo", contentType: "TRAINING" as const, order: 2 },
    { namePt: "Comunicados", nameEn: "Announcements", nameEs: "Comunicados", contentType: "TEXT" as const, order: 0 },
    { namePt: "Portfólio da Igreja", nameEn: "Church Portfolio", nameEs: "Portafolio de la Iglesia", contentType: "TEXT" as const, order: 1 },
    { namePt: "Jovens", nameEn: "Youth", nameEs: "Jóvenes", contentType: "EVENT" as const, order: 0 },
    { namePt: "Crianças", nameEn: "Kids", nameEs: "Niños", contentType: "EVENT" as const, order: 1 },
  ];

  const categories: Record<string, string> = {};
  for (const def of categoryDefs) {
    const existing = await prisma.category.findFirst({ where: { namePt: def.namePt } });
    const category = existing ?? (await prisma.category.create({ data: { ...def, status: "ACTIVE" } }));
    categories[def.namePt] = category.id;
  }

  const textCategoryId = categories["Comunicados"];
  if (textCategoryId) {
    const existingText = await prisma.textContent.findFirst({ where: { title: "Bem-vindo à plataforma" } });
    if (!existingText) {
      await prisma.textContent.create({
        data: {
          title: "Bem-vindo à plataforma",
          description: "Um resumo de como usar a plataforma de streaming da igreja.",
          contentHtml:
            "<h2>Bem-vindo!</h2><p>Aqui você encontra vídeos de cultos, treinamentos, conteúdos e a agenda de eventos da igreja. Use o menu para navegar.</p>",
          categoryId: textCategoryId,
          language: "pt_BR",
          status: "PUBLISHED",
          featured: true,
          publishedAt: new Date(),
          createdById: admin.id,
        },
      });
    }
  }

  const eventCategoryId = categories["Jovens"];
  if (eventCategoryId) {
    const existingEvent = await prisma.event.findFirst({ where: { title: "Encontro de Jovens" } });
    if (!existingEvent) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7);
      await prisma.event.create({
        data: {
          title: "Encontro de Jovens",
          description: "Uma noite de louvor, palavra e comunhão para os jovens da igreja.",
          startDate,
          location: "Templo Principal",
          categoryId: eventCategoryId,
          language: "pt_BR",
          status: "PUBLISHED",
          createdById: admin.id,
        },
      });
    }
  }

  console.log("Seed concluido.");
  console.log(`Admin: ${adminEmail} / senha inicial: ${adminPassword}`);
  console.log(`Membro: ${memberEmail} / senha inicial: ${memberPassword}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
