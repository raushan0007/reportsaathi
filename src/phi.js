// Client-side PHI scrubber. Runs in the browser BEFORE any text could leave
// the device (i.e. only matters when hybrid inference falls back to cloud).
// It is a best-effort safety net, not a certified de-identification tool.

const RULES = [
  // Labelled identifiers: "Patient Name: Ram Kumar", "Pt ID: 12345", "MRN - A12"
  {
    re: /\b(patient(?:'s)?\s*name|pt\.?\s*name|name|referr(?:ed|ing)\s*(?:by|doctor|physician)|ref\.?\s*by|dr\.?)\s*[:\-]\s*[A-Za-z.\s]{2,40}?(?=\s{2,}|\n|,|;|\||$)/gim,
    tag: (m, label) => `${label}: [NAME]`,
  },
  {
    re: /\b(patient\s*id|pt\.?\s*id|mrn|uhid|reg(?:istration)?\.?\s*no|accession(?:\s*no)?|study\s*id|ip\s*no|op\s*no)\s*[:\-#]?\s*[A-Za-z0-9\-\/]{3,}/gim,
    tag: (m, label) => `${label}: [ID]`,
  },
  {
    re: /\b(age(?:\s*\/\s*sex)?|dob|date\s*of\s*birth)\s*[:\-]\s*[^\n,;|]{1,25}/gim,
    tag: (m, label) => `${label}: [REDACTED]`,
  },
  // Phone numbers (India + generic)
  { re: /(?:\+?91[\s-]?)?[6-9]\d{9}\b/g, tag: () => "[PHONE]" },
  { re: /\b\d{3}[\s-]\d{3}[\s-]\d{4}\b/g, tag: () => "[PHONE]" },
  // Emails
  { re: /[\w.+-]+@[\w-]+\.[\w.]+/g, tag: () => "[EMAIL]" },
  // Aadhaar-like 12 digit groups
  { re: /\b\d{4}\s?\d{4}\s?\d{4}\b/g, tag: () => "[ID]" },
  // Dates: 12/03/2026, 12-03-26, 2026-03-12, 12 Mar 2026
  { re: /\b\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}\b/g, tag: () => "[DATE]" },
  { re: /\b\d{4}-\d{2}-\d{2}\b/g, tag: () => "[DATE]" },
  {
    re: /\b\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{2,4}\b/gi,
    tag: () => "[DATE]",
  },
];

export function scrubPHI(text) {
  let out = text;
  let count = 0;
  for (const { re, tag } of RULES) {
    out = out.replace(re, (...args) => {
      count++;
      return tag(...args);
    });
  }
  return { text: out, redactions: count };
}
