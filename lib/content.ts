import { prisma } from "./prisma";
import {
  DEFAULT_HOME,
  DEFAULT_CONTACT,
  DEFAULT_FOOTER,
  DEFAULT_BRANDING,
  DEFAULT_GUIDELINES,
  type HomeContent,
  type ContactContent,
  type FooterContent,
  type BrandingContent,
  type GuidelineContent,
} from "./defaults";

export interface ContentBundle {
  home: HomeContent;
  contact: ContactContent;
  footer: FooterContent;
  branding: BrandingContent;
  guidelines: GuidelineContent[];
}

function parse<T>(json: string | undefined, fallback: T): T {
  if (!json) return fallback;
  try {
    return { ...fallback, ...(JSON.parse(json) as object) } as T;
  } catch {
    return fallback;
  }
}

// Full content for the public site: DB overrides merged over the defaults.
export async function getContent(): Promise<ContentBundle> {
  const rows = await prisma.siteContent.findMany();
  const map = new Map(rows.map((r) => [r.key, r.json]));

  const specs = await prisma.specialization.findMany({
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
  });

  const defaultBySlug = new Map(DEFAULT_GUIDELINES.map((g) => [g.slug, g]));
  const guidelines: GuidelineContent[] = specs.map((s) => {
    const dflt = defaultBySlug.get(s.slug);
    let details: string[] | undefined;
    if (s.detailsJson) {
      try {
        details = JSON.parse(s.detailsJson);
      } catch {
        details = undefined;
      }
    }
    return {
      slug: s.slug,
      title: s.title,
      desc: s.description ?? dflt?.desc ?? "",
      details: details ?? dflt?.details ?? [],
    };
  });

  return {
    home: parse<HomeContent>(map.get("home"), DEFAULT_HOME),
    contact: parse<ContactContent>(map.get("contact"), DEFAULT_CONTACT),
    footer: parse<FooterContent>(map.get("footer"), DEFAULT_FOOTER),
    branding: parse<BrandingContent>(map.get("branding"), DEFAULT_BRANDING),
    guidelines: guidelines.length ? guidelines : DEFAULT_GUIDELINES,
  };
}
