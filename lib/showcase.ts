import type { Sector } from "@/lib/investors";

// Indicative sector outlook shown on investor cards. A sector-level label, not a forecast for any
// one business.
export const SECTOR_OUTLOOK: Record<string, string> = {
  AgriTech: "High Growth Potential",
  "Agro-Processing": "Export Growth Potential",
  FinTech: "Scalable Digital Model",
  EdTech: "Scalable SaaS",
  HealthTech: "Growing Demand",
  Retail: "Steady Local Demand",
  Tourism: "Tourism-Linked Growth",
  Logistics: "Regional Corridor Growth",
  Energy: "High Growth Potential",
  Manufacturing: "Import Substitution Opportunity",
  "Textiles & Apparel": "Steady Institutional Demand",
  "Crafts & Jewellery": "Premium Tourism Market",
  Other: "Emerging Opportunity",
};

export function sectorOutlook(sector: string | null | undefined): string {
  return (sector && SECTOR_OUTLOOK[sector]) || SECTOR_OUTLOOK.Other;
}

// Sample profiles of Namibian businesses for the investor demo. They are NOT MulaStream users: they
// have no assessment, no verified documents and no due diligence pack, and the UI labels them as
// samples. Highlights are as reported publicly and have not been checked by MulaStream.
// Before showing them publicly, get each business's permission. If they agree, you can add
// `readinessScore` (from a real MulaStream assessment) and `imageUrl` (a photo you have rights to use).
export type ShowcaseStartup = {
  slug: string;
  businessName: string;
  location: string;
  founders: string;
  sector: Sector;
  speciality: string;
  highlights: string[];
  about: string;
  readinessScore?: number;
  imageUrl?: string;
};

export const SHOWCASE_STARTUPS: ShowcaseStartup[] = [
  {
    slug: "popyeni-jewels",
    businessName: "Popyeni Jewels",
    location: "Windhoek",
    founders: "Frieda Amadhila",
    sector: "Crafts & Jewellery",
    speciality: "Handcrafted jewellery and gemstones",
    highlights: ["Award-winning designs", "Sells to lodges"],
    about: "A Windhoek jewellery business making handcrafted pieces with Namibian gemstones, selling through lodges to the tourism market.",
  },
  {
    slug: "karakulia-weavers",
    businessName: "Karakulia Weavers",
    location: "Swakopmund",
    founders: "Moses Helao",
    sector: "Textiles & Apparel",
    speciality: "Textiles and weaving",
    highlights: ["Turnaround success story", "DBN funded"],
    about: "A Swakopmund weaving workshop producing handwoven textiles, described as a turnaround success with development finance support.",
  },
  {
    slug: "lunde-trading",
    businessName: "Lunde Trading CC",
    location: "Walvis Bay",
    founders: "Ottilie Matheus",
    sector: "Textiles & Apparel",
    speciality: "Garment manufacturing (school uniforms)",
    highlights: ["Sanlam Bridge winner", "Expanding production"],
    about: "A Walvis Bay garment manufacturer focused on school uniforms, serving steady institutional demand and growing its capacity.",
  },
  {
    slug: "kokeni-ppi-chilli",
    businessName: "Kokeni PPI Chilli",
    location: "Ondangwa",
    founders: "Peyavari Tjaverua & Rosalia Nekongo",
    sector: "Agro-Processing",
    speciality: "Chilli sauces",
    highlights: ["Exporting to China", "AMTA partnership"],
    about: "An Ondangwa agro-processor turning locally grown chillies into bottled sauces, reported to be exporting and working with AMTA.",
  },
  {
    slug: "langas-agricultural-business",
    businessName: "Langa's Agricultural Business",
    location: "Swakopmund",
    founders: "Frans Shivute",
    sector: "Agro-Processing",
    speciality: "Peanut butter processing",
    highlights: ["About 3,000 jars a month", "Employs local women"],
    about: "A Swakopmund peanut butter producer making around 3,000 jars a month and creating jobs for women in the community.",
  },
];

export const SHOWCASE_ID_PREFIX = "sample-";

export function findShowcaseStartup(id: string): ShowcaseStartup | undefined {
  if (!id.startsWith(SHOWCASE_ID_PREFIX)) return undefined;
  return SHOWCASE_STARTUPS.find((s) => s.slug === id.slice(SHOWCASE_ID_PREFIX.length));
}
