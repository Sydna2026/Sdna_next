// Idempotent seed: ensures a Specialization row for each guideline, with the
// current title / description / bullet points / order. Safe to run every deploy.
// Existing edited content is preserved (we only fill nulls + keep title/order
// in sync with the code defaults on first creation). Run via: npx prisma db seed
import { PrismaClient } from "@prisma/client";

const GUIDELINES = [
  { slug: "ortho", title: "Orthodontics",
    desc: "Guidelines on the latest orthodontic techniques, diagnosis of malocclusion, and treatment planning using advanced fixed and removable appliances.",
    details: [
      "Diagnosis and treatment of dental and skeletal malocclusions.",
      "Comparative study between traditional metal braces and modern clear aligners.",
      "Planning complex clinical cases and monitoring jaw growth in children.",
    ] },
  { slug: "surgery", title: "Oral Surgery",
    desc: "Approved surgical protocols for impacted teeth extraction, principles of dental implantology, and safe management of common surgical complications.",
    details: [
      "Performing minor oral surgeries such as surgical extraction of impacted teeth.",
      "Basics of dental implant placement and selecting appropriate implant sizes.",
      "Patient anesthesia methods, post-operative hemorrhage control, and infection prevention.",
    ] },
  { slug: "fixed-prostho", title: "Fixed Prosthodontics",
    desc: "A comprehensive guide to crown and bridge preparation, selecting suitable dental materials (zirconia & porcelain), and digital or traditional impression methods.",
    details: [
      "Rules of tooth preparation to receive crowns and bridges without pulpal damage.",
      "Clinical comparison between zirconia, all-ceramic, and porcelain-fused-to-metal crowns.",
      "Digital impression techniques using state-of-the-art intraoral scanners.",
    ] },
  { slug: "removable-prostho", title: "Removable Prosthodontics",
    desc: "Design and fabrication steps for complete and partial dentures, focusing on denture stability and patient comfort.",
    details: [
      "Designing complete dentures for edentulous patients using anatomical support points.",
      "Fabricating and adjusting acrylic and chromium-cobalt partial dentures.",
      "Solving instability issues and training patients on proper denture usage.",
    ] },
  { slug: "pediatric", title: "Pediatric Dentistry",
    desc: "Psychological and behavioral management of children in the dental clinic, early caries prevention, and pulp treatments for primary teeth.",
    details: [
      "Applying positive behavior guidance techniques to overcome dental fear in children.",
      "Treating dental caries, topical fluoride application, and pit & fissure sealants.",
      "Endodontic treatments for primary teeth (pulpotomy and pulpectomy).",
    ] },
  { slug: "endodontics", title: "Endodontics",
    desc: "Modern techniques in root canal preparation using rotary instruments, irrigation protocols, and three-dimensional obturation.",
    details: [
      "Determining working length accurately using electronic apex locators.",
      "Mechanical preparation of root canals using modern rotary systems.",
      "Applying chemical irrigation protocols to disinfect root canals and obturate them in 3D.",
    ] },
  { slug: "medicine", title: "Oral Medicine",
    desc: "Diagnosis and management of oral mucosal lesions, differentiating between benign and malignant conditions, and managing medically compromised dental patients.",
    details: [
      "Thorough clinical examination of oral mucosa and diagnosing ulcerations and stomatitis.",
      "Managing chronic disease patients (diabetes, hypertension, bleeding disorders) in the dental clinic.",
      "Prescribing appropriate medications and early intervention in cases of suspected tumors.",
    ] },
  { slug: "histology", title: "Oral Histology",
    desc: "Microscopic study of hard and soft oral tissues, and the stages of prenatal and clinical development of teeth and jaws.",
    details: [
      "Microscopic study of enamel, dentin, cementum, and periodontal ligament cells.",
      "Tracking the stages of tooth development (odontogenesis) during embryonic stages.",
      "Understanding the cellular processes responsible for natural tooth eruption and shedding.",
    ] },
];

const prisma = new PrismaClient();

async function main() {
  // First-run only: once any specialization exists, the guidelines are fully
  // admin-managed (add/edit/remove), so we must NOT re-create deleted ones.
  const count = await prisma.specialization.count();
  if (count > 0) {
    console.log(`Specializations already present (${count}) — skipping seed.`);
    return;
  }
  for (let i = 0; i < GUIDELINES.length; i++) {
    const g = GUIDELINES[i];
    await prisma.specialization.create({
      data: {
        slug: g.slug,
        title: g.title,
        description: g.desc,
        detailsJson: JSON.stringify(g.details),
        sortOrder: i,
      },
    });
  }
  console.log(`Seeded ${GUIDELINES.length} specializations.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
