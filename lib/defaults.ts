// Default site content. These mirror what was hard-coded in the page, and are
// used as fallbacks wherever the database has no override yet. Editing content
// in the admin panel writes overrides to the DB; these stay as the baseline.

export interface AboutCard {
  title: string;
  desc: string;
}
export interface HomeContent {
  heroLine1: string;
  heroLine2: string;
  heroSubtitle: string;
  aboutHeading: string;
  cards: AboutCard[];
}
export interface ContactContent {
  adminName: string;
  adminTitle: string;
  email: string;
  phone: string;
  instagram: string;
  gmail: string;
  linkedin: string;
  joinFormUrl: string;
  shareIdeasUrl: string;
}
export interface FooterContent {
  copyright: string;
}
export interface BrandingContent {
  brand: string;
  subtitle: string;
}
export interface GuidelineContent {
  slug: string;
  title: string;
  desc: string;
  details: string[];
}

export const DEFAULT_HOME: HomeContent = {
  heroLine1: "Syrian Dental",
  heroLine2: "Academic Network",
  heroSubtitle:
    "Connecting Syrian dental minds, turning clinic stories into shared science. Because our work doesn't end in the clinic—it begins with research.",
  aboutHeading: "About Our Network",
  cards: [
    {
      title: "Who We Are",
      desc: "We are the first dental network in Syria built to bring science into our daily practice. We connect Syrian dentists everywhere to help each other learn, research, and grow together",
    },
    {
      title: "Our Vision",
      desc: "To transform dental medicine in Syria into a truly Evidence-Based Practice—replacing old rituals and personal opinions with solid, verified scientific proof.",
    },
    {
      title: "Our Message",
      desc: "To help Syrian dental students and clinicians go beyond daily clinic routines and dive deep into research. We provide the essential tools to understand scientific data, support the publication of local clinical work, and bridge the gap between everyday practice and global guidelines.",
    },
  ],
};

export const DEFAULT_CONTACT: ContactContent = {
  adminName: "Sulaf Alghazali",
  adminTitle: "SYDAN Administration",
  email: "sulafghazali@gmail.com",
  phone: "+963 934 639 540",
  instagram: "https://www.instagram.com/syrian.dan?igsh=MTVxcnlnNmg4NjM0ZA==",
  gmail: "sdan.dental@gmail.com",
  linkedin: "https://linkedin.com",
  joinFormUrl: "https://forms.gle/cPS6kZHtZyXcvewj9",
  shareIdeasUrl: "https://docs.google.com",
};

export const DEFAULT_FOOTER: FooterContent = {
  copyright: "© 2026 SYDAN Website. All rights reserved.",
};

export const DEFAULT_BRANDING: BrandingContent = {
  brand: "SyDAN",
  subtitle: "SYRIAN NETWORK",
};

export const DEFAULT_GUIDELINES: GuidelineContent[] = [
  {
    slug: "ortho",
    title: "Orthodontics",
    desc: "Guidelines on the latest orthodontic techniques, diagnosis of malocclusion, and treatment planning using advanced fixed and removable appliances.",
    details: [
      "Diagnosis and treatment of dental and skeletal malocclusions.",
      "Comparative study between traditional metal braces and modern clear aligners.",
      "Planning complex clinical cases and monitoring jaw growth in children.",
    ],
  },
  {
    slug: "surgery",
    title: "Oral Surgery",
    desc: "Approved surgical protocols for impacted teeth extraction, principles of dental implantology, and safe management of common surgical complications.",
    details: [
      "Performing minor oral surgeries such as surgical extraction of impacted teeth.",
      "Basics of dental implant placement and selecting appropriate implant sizes.",
      "Patient anesthesia methods, post-operative hemorrhage control, and infection prevention.",
    ],
  },
  {
    slug: "fixed-prostho",
    title: "Fixed Prosthodontics",
    desc: "A comprehensive guide to crown and bridge preparation, selecting suitable dental materials (zirconia & porcelain), and digital or traditional impression methods.",
    details: [
      "Rules of tooth preparation to receive crowns and bridges without pulpal damage.",
      "Clinical comparison between zirconia, all-ceramic, and porcelain-fused-to-metal crowns.",
      "Digital impression techniques using state-of-the-art intraoral scanners.",
    ],
  },
  {
    slug: "removable-prostho",
    title: "Removable Prosthodontics",
    desc: "Design and fabrication steps for complete and partial dentures, focusing on denture stability and patient comfort.",
    details: [
      "Designing complete dentures for edentulous patients using anatomical support points.",
      "Fabricating and adjusting acrylic and chromium-cobalt partial dentures.",
      "Solving instability issues and training patients on proper denture usage.",
    ],
  },
  {
    slug: "pediatric",
    title: "Pediatric Dentistry",
    desc: "Psychological and behavioral management of children in the dental clinic, early caries prevention, and pulp treatments for primary teeth.",
    details: [
      "Applying positive behavior guidance techniques to overcome dental fear in children.",
      "Treating dental caries, topical fluoride application, and pit & fissure sealants.",
      "Endodontic treatments for primary teeth (pulpotomy and pulpectomy).",
    ],
  },
  {
    slug: "endodontics",
    title: "Endodontics",
    desc: "Modern techniques in root canal preparation using rotary instruments, irrigation protocols, and three-dimensional obturation.",
    details: [
      "Determining working length accurately using electronic apex locators.",
      "Mechanical preparation of root canals using modern rotary systems.",
      "Applying chemical irrigation protocols to disinfect root canals and obturate them in 3D.",
    ],
  },
  {
    slug: "medicine",
    title: "Oral Medicine",
    desc: "Diagnosis and management of oral mucosal lesions, differentiating between benign and malignant conditions, and managing medically compromised dental patients.",
    details: [
      "Thorough clinical examination of oral mucosa and diagnosing ulcerations and stomatitis.",
      "Managing chronic disease patients (diabetes, hypertension, bleeding disorders) in the dental clinic.",
      "Prescribing appropriate medications and early intervention in cases of suspected tumors.",
    ],
  },
  {
    slug: "histology",
    title: "Oral Histology",
    desc: "Microscopic study of hard and soft oral tissues, and the stages of prenatal and clinical development of teeth and jaws.",
    details: [
      "Microscopic study of enamel, dentin, cementum, and periodontal ligament cells.",
      "Tracking the stages of tooth development (odontogenesis) during embryonic stages.",
      "Understanding the cellular processes responsible for natural tooth eruption and shedding.",
    ],
  },
];
