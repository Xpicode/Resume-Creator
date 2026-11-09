import type { TemplateSlug } from "@/features/resume/schema";

export const TEMPLATE_OPTIONS: { slug: TemplateSlug; name: string; use: string }[] = [
  {
    slug: "ats-classic",
    name: "ATS Classic",
    use: "best for online applications (JobStreet, Indeed)",
  },
  {
    slug: "ph-traditional",
    name: "PH Traditional",
    use: "with 2x2 photo, for walk-in / printed applications",
  },
];
