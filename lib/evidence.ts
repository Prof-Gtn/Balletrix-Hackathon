// Evidence types a founder can upload, in dropdown order. Keys are stored in evidence_submissions.evidence_type.
export const EVIDENCE_TYPE_LABELS = {
  signed_contract: "Signed Contract",
  bank_statement: "Bank Statement",
  invoice: "Invoice",
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

// Evidence types that are verified automatically on upload; "Other" is flagged for human review.
export const AUTO_VERIFIED_TYPES: readonly EvidenceType[] = ["signed_contract", "bank_statement", "invoice"];

// Prefixes the upload flow adds before the file name: a UUID (current) or a 13-digit timestamp (older rows).
const UPLOAD_PREFIX = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|\d{13})-/i;

// file_url holds a storage public URL, an older storage path (<user id>/<timestamp>-<file name>)
// or a plain file name; returns the original file name in every case.
export function fileNameFromPath(fileUrl: string): string {
  if (!fileUrl.includes("/")) return fileUrl;
  const lastSegment = fileUrl.split("?")[0].split("/").pop() ?? fileUrl;
  let decoded = lastSegment;
  try {
    decoded = decodeURIComponent(lastSegment);
  } catch {
    // Not URL-encoded; use as-is.
  }
  return decoded.replace(UPLOAD_PREFIX, "");
}
