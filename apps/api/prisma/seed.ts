import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const saoPaulo = await prisma.church.upsert({
    where: { id: 1 },
    update: {},
    create: { name: "São Paulo" },
  });
  await prisma.church.upsert({
    where: { id: 2 },
    update: {},
    create: { name: "Osasco" },
  });

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
      churchId: saoPaulo.id,
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
      churchId: saoPaulo.id,
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
    const existing = await prisma.category.findFirst({ where: { namePt: def.namePt, churchId: saoPaulo.id } });
    const category =
      existing ?? (await prisma.category.create({ data: { ...def, status: "ACTIVE", churchId: saoPaulo.id } }));
    categories[def.namePt] = category.id;
  }

  const textCategoryId = categories["Comunicados"];
  if (textCategoryId) {
    const existingText = await prisma.textContent.findFirst({
      where: { titlePt: "Bem-vindo à plataforma", churchId: saoPaulo.id },
    });
    if (!existingText) {
      await prisma.textContent.create({
        data: {
          titlePt: "Bem-vindo à plataforma",
          titleEn: "Welcome to the platform",
          titleEs: "Bienvenido a la plataforma",
          descriptionPt: "Um resumo de como usar a plataforma de streaming da igreja.",
          descriptionEn: "A summary of how to use the church's streaming platform.",
          descriptionEs: "Un resumen de cómo usar la plataforma de streaming de la iglesia.",
          contentHtmlPt:
            "<h2>Bem-vindo!</h2><p>Aqui você encontra vídeos de cultos, treinamentos, conteúdos e a agenda de eventos da igreja. Use o menu para navegar.</p>",
          contentHtmlEn:
            "<h2>Welcome!</h2><p>Here you'll find service videos, trainings, content and the church's event calendar. Use the menu to navigate.</p>",
          contentHtmlEs:
            "<h2>¡Bienvenido!</h2><p>Aquí encontrarás videos de cultos, capacitaciones, contenidos y la agenda de eventos de la iglesia. Usa el menú para navegar.</p>",
          categoryId: textCategoryId,
          status: "PUBLISHED",
          featured: true,
          publishedAt: new Date(),
          createdById: admin.id,
          churchId: saoPaulo.id,
        },
      });
    }
  }

  const eventCategoryId = categories["Jovens"];
  if (eventCategoryId) {
    const existingEvent = await prisma.event.findFirst({
      where: { titlePt: "Encontro de Jovens", churchId: saoPaulo.id },
    });
    if (!existingEvent) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7);
      await prisma.event.create({
        data: {
          titlePt: "Encontro de Jovens",
          titleEn: "Youth Gathering",
          titleEs: "Encuentro de Jóvenes",
          descriptionPt: "Uma noite de louvor, palavra e comunhão para os jovens da igreja.",
          descriptionEn: "An evening of worship, word and fellowship for the church's youth.",
          descriptionEs: "Una noche de alabanza, palabra y comunión para los jóvenes de la iglesia.",
          startDate,
          location: "Templo Principal",
          categoryId: eventCategoryId,
          status: "PUBLISHED",
          createdById: admin.id,
          churchId: saoPaulo.id,
        },
      });
    }
  }

  console.log("Seed concluido.");
  console.log(`Igrejas: São Paulo (id ${saoPaulo.id}), Osasco`);
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
