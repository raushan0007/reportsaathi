export function buildPrompt(reportText, { language, readingLevel }) {
  const lang =
    language === "hi"
      ? "simple Hindi (Devanagari script), keeping medical terms in English in brackets"
      : "simple English";
  return `You help patients understand their own radiology reports (X-ray, CT, MRI, ultrasound).
Explain the report below in ${lang}, so that ${readingLevel} could follow it.

Rules:
- Do NOT diagnose, predict outcomes or recommend treatment. Only explain what the report says.
- If something sounds urgent in the report (e.g. "critical", "urgent", "immediate"), say clearly: "Please show this report to your doctor today."
- Be calm and kind. No scary words unless the report itself uses them.

Answer in exactly these sections, using markdown headings:
## In one line
## What the scan looked at
## Key findings, in plain words
(bullet list; for each medical term, give the plain meaning)
## Questions to ask your doctor
(3 to 5 bullets)

Report:
"""
${reportText}
"""`;
}

export const IMAGE_PROMPT = `This is a photo of a radiology report. Transcribe ONLY the report text (findings and impression) exactly as written. Leave out patient name, IDs, phone numbers and dates. Output plain text only.`;
