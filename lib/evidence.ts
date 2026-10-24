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
