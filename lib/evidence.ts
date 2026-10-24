// Evidence types a founder can upload. Keys are stored in evidence_submissions.evidence_type.
export const EVIDENCE_TYPE_LABELS = {
  signed_contract: "Signed Contract",
  invoice: "Invoice",
  bank_statement: "Bank Statement",
  other: "Other",
} as const;

export type EvidenceType = keyof typeof EVIDENCE_TYPE_LABELS;

// evidence_type of the rows runAssessment stores in the same table; these are not uploaded evidence.
export const ASSESSMENT_EVIDENCE_TYPE = "business_assessment";

export function isEvidenceType(value: unknown): value is EvidenceType {
  return typeof value === "string" && Object.hasOwn(EVIDENCE_TYPE_LABELS, value);
}

// Accepts a key ("signed_contract") or a label ("Signed Contract"), ignoring case and spacing.
export function toEvidenceType(value: unknown): EvidenceType | null {
  if (typeof value !== "string") return null;
  const normalised = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return isEvidenceType(normalised) ? normalised : null;
}

// Evidence types that are verified automatically on upload.
export const AUTO_VERIFIED_TYPES: readonly EvidenceType[] = ["signed_contract", "invoice"];

// Uploads are stored as <user id>/<timestamp>-<file name>; returns the original file name.
export function fileNameFromPath(path: string): string {
  return (path.split("/").pop() ?? path).replace(/^\d+-/, "");
}
