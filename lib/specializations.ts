// Single source of truth for the specialization slugs + titles.
// These slugs MUST match the `id` values used in app/page.tsx guidelinesData,
// because the subscribe form sends the guideline id as the slug.
export const SPECIALIZATIONS: { slug: string; title: string }[] = [
  { slug: "ortho", title: "Orthodontics" },
  { slug: "surgery", title: "Oral Surgery" },
  { slug: "fixed-prostho", title: "Fixed Prosthodontics" },
  { slug: "removable-prostho", title: "Removable Prosthodontics" },
  { slug: "pediatric", title: "Pediatric Dentistry" },
  { slug: "endodontics", title: "Endodontics" },
  { slug: "medicine", title: "Oral Medicine" },
  { slug: "histology", title: "Oral Histology" },
];

export const SPECIALIZATION_TITLES: Record<string, string> = Object.fromEntries(
  SPECIALIZATIONS.map((s) => [s.slug, s.title]),
);
