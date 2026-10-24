// Options for the investor preference form, shared with the server action that validates them.
export const SECTORS = [
  "AgriTech",
  "FinTech",
  "Retail",
  "HealthTech",
  "EdTech",
  "Tourism",
  "Logistics",
  "Energy",
  "Manufacturing",
  "Agro-Processing",
  "Textiles & Apparel",
  "Crafts & Jewellery",
  "Other",
] as const;

export const INSTRUMENTS = {
  debt: "Debt",
  equity: "Equity",
} as const;

export type Sector = (typeof SECTORS)[number];

// The entrepreneur's sector, mocked until profiles has a sector column.
export const MOCK_ENTREPRENEUR_SECTOR: Sector = "Retail";
export type Instrument = keyof typeof INSTRUMENTS;

export function isSector(value: unknown): value is Sector {
  return typeof value === "string" && (SECTORS as readonly string[]).includes(value);
}

export function isInstrument(value: unknown): value is Instrument {
  return typeof value === "string" && Object.hasOwn(INSTRUMENTS, value);
}

export function formatNad(amount: number): string {
  return `N$ ${new Intl.NumberFormat("en-NA", { maximumFractionDigits: 0 }).format(amount)}`;
}
