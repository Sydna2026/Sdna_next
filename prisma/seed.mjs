// Idempotent seed: ensures a Specialization row exists for each slug/title.
// Safe to run on every deploy. Run via: npx prisma db seed
import { PrismaClient } from "@prisma/client";

const SPECIALIZATIONS = [
  { slug: "ortho", title: "Orthodontics" },
  { slug: "surgery", title: "Oral Surgery" },
  { slug: "fixed-prostho", title: "Fixed Prosthodontics" },
  { slug: "removable-prostho", title: "Removable Prosthodontics" },
  { slug: "pediatric", title: "Pediatric Dentistry" },
  { slug: "endodontics", title: "Endodontics" },
  { slug: "medicine", title: "Oral Medicine" },
  { slug: "histology", title: "Oral Histology" },
];

const prisma = new PrismaClient();

async function main() {
  for (const s of SPECIALIZATIONS) {
    await prisma.specialization.upsert({
      where: { slug: s.slug },
      update: { title: s.title },
      create: { slug: s.slug, title: s.title },
    });
  }
  console.log(`Seeded ${SPECIALIZATIONS.length} specializations.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
