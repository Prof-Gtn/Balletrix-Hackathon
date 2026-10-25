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
// `readinessScore` (from a real MulaStream assessment).
// `imageUrl` is an illustrative Unsplash photo of the sector, NOT of the business; the card labels it as
// such. Replace it with the business's own photo if they give you one. No image = a branded tile.
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
    imageUrl: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", // illustrative: gemstone pendant
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
    imageUrl: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", // illustrative: rack of knitwear
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
    imageUrl: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", // illustrative: plain sweatshirt
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
    imageUrl: "https://images.unsplash.com/photo-1526346698789-22fd84314424?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", // illustrative: red chillies
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

// Photos for the three fictional demo startups seeded by supabase/seed/demo_investment_ready_startups.sql.
// They are real database profiles (shown as verified startups), but the database has no image column,
// so their pictures are matched here by profile id. Any other startup gets the gradient tile.
export const DEMO_STARTUP_IMAGES: Record<string, string> = {
  // Desert Rose Jewellery: gold jewellery flat-lay
  "d3a0c0de-0000-4000-8000-000000000001": "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  // Kalahari Loom Textiles: woven carpet
  "d3a0c0de-0000-4000-8000-000000000002": "https://images.unsplash.com/photo-1600166898405-da9535204843?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  // Coastline Uniforms CC: craftsman at a workshop machine
  "d3a0c0de-0000-4000-8000-000000000003": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
};

export function findShowcaseStartup(id: string): ShowcaseStartup | undefined {
  if (!id.startsWith(SHOWCASE_ID_PREFIX)) return undefined;
  return SHOWCASE_STARTUPS.find((s) => s.slug === id.slice(SHOWCASE_ID_PREFIX.length));
}
